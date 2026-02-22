# ElevenLabs AI Agent "Marina" Integration Guide

## Overview

This document provides comprehensive instructions for integrating ElevenLabs Conversational AI agent "Marina" with your A1 Marine Care quote application to automate customer follow-up after deposit payment. The integration enables Marina to automatically contact customers, confirm service details, and schedule appointments without manual intervention.

## Prerequisites

Before beginning the integration, ensure you have:

- **ElevenLabs Account**: Active subscription with Conversational AI access
- **A1 Marine Care Quote App**: Published and accessible at your Manus domain
- **Stripe Account**: Payment link configured with webhook access
- **Customer Data Storage**: Method to capture and store customer information from quote submissions

## Integration Architecture

The integration follows this workflow:

1. Customer completes quote form and pays $250 deposit via Stripe
2. Stripe redirects customer to `/thank-you` page
3. Stripe webhook sends payment confirmation to your backend
4. Backend extracts customer data and triggers ElevenLabs API
5. Marina (ElevenLabs AI agent) initiates phone call to customer
6. Marina confirms service details and schedules appointment
7. Appointment data syncs back to your system

## Phase 1: Configure ElevenLabs Conversational AI

### Step 1: Create Marina Agent

Navigate to your ElevenLabs dashboard and create a new Conversational AI agent with these specifications:

**Agent Configuration**

| Parameter | Value |
|-----------|-------|
| Agent Name | Marina |
| Voice | Select a professional, friendly female voice |
| Language | English (US) |
| Response Style | Conversational, helpful, professional |
| Personality | Warm, knowledgeable about marine detailing |

**Agent Instructions (System Prompt)**

Configure Marina's behavior with this system prompt:

> You are Marina, a customer service representative for A1 Marine Care, a premium boat detailing company. Your role is to follow up with customers who have just paid a $250 deposit for boat detailing services.
>
> **Your Objectives:**
> 1. Thank the customer warmly for their deposit and business
> 2. Confirm their boat details (length, type, location)
> 3. Verify the services they selected (gelcoat restoration, interior detailing, etc.)
> 4. Offer to answer any questions about the services
> 5. Schedule a convenient appointment time for the service
> 6. Provide your contact information for future questions
>
> **Key Information to Collect:**
> - Preferred service date and time
> - Specific location/marina access instructions
> - Any special concerns or requests about their boat
> - Best contact method for service day coordination
>
> **Tone Guidelines:**
> - Professional yet friendly and approachable
> - Knowledgeable about marine detailing processes
> - Patient and thorough when explaining services
> - Enthusiastic about delivering exceptional results
>
> **Important Notes:**
> - The $250 deposit is non-refundable but applies to final invoice
> - Service completion timeline depends on boat size and services selected
> - Weather conditions may affect outdoor service scheduling
> - Customer will receive 24-hour reminder before appointment

### Step 2: Configure Agent Variables

Set up dynamic variables that will be populated from customer data:

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `customer_name` | Customer's full name | "John Smith" |
| `boat_length` | Boat length in feet | "32" |
| `boat_type` | Type of boat | "Cruiser" |
| `service_location` | Marina or city | "Toronto" |
| `services_selected` | Comma-separated service list | "Gelcoat Restoration (Full Boat), Ceramic Coating" |
| `estimated_total` | Total quote amount | "$3,200" |
| `customer_email` | Customer email address | "john@example.com" |
| `customer_phone` | Customer phone number | "(555) 123-4567" |

Configure Marina to use these variables in her opening statement:

> "Hi {{customer_name}}, this is Marina calling from A1 Marine Care. I'm reaching out to thank you for your recent $250 deposit and to help schedule your boat detailing service. I have your information here showing a {{boat_length}}-foot {{boat_type}} located in {{service_location}}, and you've selected {{services_selected}}. Is now a good time to confirm these details and find a perfect appointment time for you?"

### Step 3: Enable Phone Calling

Configure Marina's phone calling capabilities:

1. Navigate to **Agent Settings** → **Channels**
2. Enable **Outbound Phone Calls**
3. Configure phone number settings:
   - **Caller ID**: Use your business phone number or ElevenLabs provided number
   - **Call Recording**: Enable for quality assurance
   - **Voicemail Detection**: Enable to leave automated messages
4. Set call retry logic:
   - **Max Attempts**: 3 calls over 48 hours
   - **Retry Interval**: 4 hours between attempts
   - **Voicemail Message**: "Hi, this is Marina from A1 Marine Care. We received your deposit and would love to schedule your boat detailing service. Please call us back at (555) 123-4567 or reply to our email. Thank you!"

## Phase 2: Upgrade to Full-Stack Application

Your current quote app is **static (frontend-only)**. To integrate ElevenLabs, you need backend capabilities to:

- Receive Stripe webhook events
- Store customer data
- Make API calls to ElevenLabs
- Manage appointment scheduling

### Upgrade Your Manus Project

Use the `webdev_add_feature` tool to upgrade your project:

```bash
# This will add backend server, database, and API capabilities
webdev_add_feature --feature web-db-user
```

This upgrade provides:

- **Backend Server**: Express.js API for webhook handling
- **Database**: PostgreSQL for customer and appointment data
- **Environment Secrets**: Secure storage for API keys
- **User Authentication**: Optional Manus OAuth integration

### Create Database Schema

After upgrading, create tables to store customer data:

```sql
-- Customer quotes table
CREATE TABLE quotes (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  boat_length INTEGER NOT NULL,
  boat_type VARCHAR(100) NOT NULL,
  service_location VARCHAR(255) NOT NULL,
  services_selected TEXT NOT NULL,
  estimated_total DECIMAL(10, 2) NOT NULL,
  deposit_paid BOOLEAN DEFAULT FALSE,
  stripe_payment_id VARCHAR(255),
  marina_contacted BOOLEAN DEFAULT FALSE,
  appointment_scheduled BOOLEAN DEFAULT FALSE,
  appointment_datetime TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Appointment scheduling table
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER REFERENCES quotes(id),
  scheduled_datetime TIMESTAMP NOT NULL,
  duration_hours INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Phase 3: Implement Stripe Webhook Handler

### Step 1: Configure Stripe Webhook

1. Log into **Stripe Dashboard**
2. Navigate to **Developers** → **Webhooks**
3. Click **Add Endpoint**
4. Set webhook URL: `https://your-domain.manus.space/api/stripe-webhook`
5. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
6. Copy the **Webhook Signing Secret** (starts with `whsec_`)

### Step 2: Store Webhook Secret

Add the webhook secret to your Manus project:

1. Open **Management UI** → **Settings** → **Secrets**
2. Add new secret:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Your webhook signing secret from Stripe

### Step 3: Create Webhook Handler

Create `server/routes/stripe-webhook.ts`:

```typescript
import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Extract customer metadata (you'll need to add this to your Stripe payment link)
    const customerData = {
      name: session.customer_details?.name,
      email: session.customer_details?.email,
      phone: session.customer_details?.phone,
      // Add custom metadata from your quote form
      boatLength: session.metadata?.boat_length,
      boatType: session.metadata?.boat_type,
      serviceLocation: session.metadata?.service_location,
      servicesSelected: session.metadata?.services_selected,
      estimatedTotal: session.metadata?.estimated_total,
    };

    // Save to database
    await saveQuoteToDatabase(customerData, session.id);

    // Trigger ElevenLabs call
    await triggerMarinaCall(customerData);
  }

  res.json({ received: true });
});

async function saveQuoteToDatabase(data: any, stripePaymentId: string) {
  // Database insert logic here
  // Use your database client to insert into quotes table
}

async function triggerMarinaCall(data: any) {
  // ElevenLabs API call logic (see Phase 4)
}

export default router;
```

## Phase 4: Integrate ElevenLabs API

### Step 1: Get ElevenLabs API Key

1. Log into **ElevenLabs Dashboard**
2. Navigate to **Profile** → **API Keys**
3. Create new API key with **Conversational AI** permissions
4. Copy the API key (starts with `sk_`)

### Step 2: Store API Key

Add to Manus project secrets:

1. **Management UI** → **Settings** → **Secrets**
2. Add new secret:
   - **Key**: `ELEVENLABS_API_KEY`
   - **Value**: Your ElevenLabs API key

### Step 3: Get Marina Agent ID

1. In ElevenLabs dashboard, open Marina agent settings
2. Copy the **Agent ID** (found in URL or settings panel)
3. Add to secrets:
   - **Key**: `ELEVENLABS_AGENT_ID`
   - **Value**: Marina's agent ID

### Step 4: Implement ElevenLabs API Call

Create `server/services/elevenlabs.ts`:

```typescript
import axios from 'axios';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  boatLength: string;
  boatType: string;
  serviceLocation: string;
  servicesSelected: string;
  estimatedTotal: string;
}

export async function triggerMarinaCall(customerData: CustomerData) {
  const apiKey = process.env.ELEVENLABS_API_KEY!;
  const agentId = process.env.ELEVENLABS_AGENT_ID!;

  try {
    const response = await axios.post(
      \`https://api.elevenlabs.io/v1/convai/conversations\`,
      {
        agent_id: agentId,
        phone_number: customerData.phone,
        variables: {
          customer_name: customerData.name,
          boat_length: customerData.boatLength,
          boat_type: customerData.boatType,
          service_location: customerData.serviceLocation,
          services_selected: customerData.servicesSelected,
          estimated_total: customerData.estimatedTotal,
          customer_email: customerData.email,
          customer_phone: customerData.phone,
        },
        metadata: {
          quote_source: 'a1_marine_quote_app',
          customer_email: customerData.email,
        },
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Marina call initiated:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to trigger Marina call:', error);
    throw error;
  }
}
```

## Phase 5: Capture Customer Data from Quote Form

Currently, your quote form collects customer data but doesn't send it to Stripe metadata. You need to modify the deposit button to include this data.

### Update Home.tsx Deposit Button

Modify the deposit button to pass metadata to Stripe:

```typescript
// In client/src/pages/Home.tsx

const handleDepositClick = () => {
  // Build metadata string to append to Stripe URL
  const metadata = new URLSearchParams({
    boat_length: boatDetails.length.toString(),
    boat_type: boatDetails.type,
    service_location: boatDetails.location,
    services_selected: getSelectedServicesString(),
    estimated_total: estimate.subtotal.toString(),
    customer_name: contactInfo.fullName,
    customer_email: contactInfo.email,
    customer_phone: contactInfo.phone,
  });

  // Stripe payment link with metadata
  const stripeUrl = \`https://buy.stripe.com/4gM3cvetybh54ao8Tjgbm01?prefilled_email=\${encodeURIComponent(contactInfo.email)}&client_reference_id=\${Date.now()}\`;
  
  window.location.href = stripeUrl;
};
```

**Note**: Stripe payment links have limitations on metadata. You may need to:

1. Switch to **Stripe Checkout Sessions** (more flexible)
2. Or store quote data in your database first, then pass only a quote ID to Stripe

### Alternative: Store Quote Before Payment

Better approach - save quote to database before redirecting to Stripe:

```typescript
const handleDepositClick = async () => {
  // Save quote to your backend first
  const quoteResponse = await fetch('/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: contactInfo.fullName,
      customerEmail: contactInfo.email,
      customerPhone: contactInfo.phone,
      boatLength: boatDetails.length,
      boatType: boatDetails.type,
      serviceLocation: boatDetails.location,
      servicesSelected: getSelectedServicesString(),
      estimatedTotal: estimate.subtotal,
    }),
  });

  const { quoteId } = await quoteResponse.json();

  // Redirect to Stripe with quote ID
  const stripeUrl = \`https://buy.stripe.com/4gM3cvetybh54ao8Tjgbm01?client_reference_id=\${quoteId}&prefilled_email=\${encodeURIComponent(contactInfo.email)}\`;
  
  window.location.href = stripeUrl;
};
```

Then in your webhook handler, retrieve the quote using `client_reference_id`:

```typescript
const quoteId = session.client_reference_id;
const quote = await getQuoteFromDatabase(quoteId);
await triggerMarinaCall(quote);
```

## Phase 6: Handle Marina's Appointment Scheduling

### Configure Marina to Capture Appointment Data

In Marina's agent settings, configure **Structured Data Extraction**:

```json
{
  "appointment_date": {
    "type": "date",
    "description": "Preferred service date"
  },
  "appointment_time": {
    "type": "time",
    "description": "Preferred service time"
  },
  "special_requests": {
    "type": "string",
    "description": "Any special requests or concerns"
  },
  "marina_access_notes": {
    "type": "string",
    "description": "Marina access instructions"
  }
}
```

### Set Up ElevenLabs Webhook

Configure ElevenLabs to send appointment data back to your system:

1. In ElevenLabs dashboard, go to **Agent Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.manus.space/api/elevenlabs-webhook`
3. Select events: `conversation.completed`

### Create ElevenLabs Webhook Handler

Create `server/routes/elevenlabs-webhook.ts`:

```typescript
import express from 'express';

const router = express.Router();

router.post('/elevenlabs-webhook', express.json(), async (req, res) => {
  const { event, data } = req.body;

  if (event === 'conversation.completed') {
    const {
      conversation_id,
      customer_email,
      structured_data,
      transcript,
    } = data;

    // Extract appointment details
    const appointmentData = {
      customerEmail: structured_data.customer_email,
      appointmentDate: structured_data.appointment_date,
      appointmentTime: structured_data.appointment_time,
      specialRequests: structured_data.special_requests,
      marinaAccessNotes: structured_data.marina_access_notes,
    };

    // Save appointment to database
    await saveAppointmentToDatabase(appointmentData);

    // Send confirmation email to customer
    await sendAppointmentConfirmationEmail(appointmentData);

    // Update quote status
    await updateQuoteStatus(customer_email, {
      marina_contacted: true,
      appointment_scheduled: true,
    });
  }

  res.json({ received: true });
});

async function saveAppointmentToDatabase(data: any) {
  // Insert into appointments table
}

async function sendAppointmentConfirmationEmail(data: any) {
  // Send email confirmation with appointment details
}

async function updateQuoteStatus(email: string, updates: any) {
  // Update quotes table
}

export default router;
```

## Phase 7: Testing the Integration

### Test Checklist

| Test Step | Expected Result | Status |
|-----------|----------------|--------|
| Submit quote form with test data | Quote saved to database | ☐ |
| Click deposit button | Redirected to Stripe payment page | ☐ |
| Complete test payment | Redirected to `/thank-you` page | ☐ |
| Check Stripe webhook logs | Webhook received and processed | ☐ |
| Verify database | Quote marked as `deposit_paid: true` | ☐ |
| Check ElevenLabs dashboard | Marina call initiated | ☐ |
| Answer Marina's call | Conversation flows naturally | ☐ |
| Schedule appointment with Marina | Appointment data captured | ☐ |
| Check ElevenLabs webhook logs | Appointment data sent to backend | ☐ |
| Verify database | Appointment saved correctly | ☐ |
| Check customer email | Confirmation email received | ☐ |

### Test Mode Configuration

Use Stripe test mode and ElevenLabs sandbox environment:

**Stripe Test Cards**:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**ElevenLabs Test Mode**:
- Enable "Test Mode" in agent settings
- Calls will be simulated without actual phone calls
- Use test phone number: `+1 555 000 0000`

## Phase 8: Production Deployment

### Pre-Launch Checklist

- [ ] Update Stripe payment link redirect URL to production domain
- [ ] Switch Stripe from test mode to live mode
- [ ] Update Stripe webhook endpoint to production URL
- [ ] Disable ElevenLabs test mode
- [ ] Configure Marina's caller ID with your business phone number
- [ ] Set up call recording storage and retention policy
- [ ] Test full flow with real phone number
- [ ] Configure email notifications for failed calls
- [ ] Set up monitoring for webhook failures
- [ ] Document escalation process for Marina issues

### Monitoring and Maintenance

**Key Metrics to Track**:

| Metric | Target | Monitoring Method |
|--------|--------|-------------------|
| Webhook success rate | >99% | Stripe dashboard |
| Marina call connection rate | >85% | ElevenLabs analytics |
| Appointment scheduling rate | >70% | Database queries |
| Customer satisfaction | >4.5/5 | Post-service surveys |

**Common Issues and Solutions**:

| Issue | Cause | Solution |
|-------|-------|----------|
| Webhook not received | Firewall blocking | Whitelist Stripe IPs |
| Marina call fails | Invalid phone number | Add phone validation to form |
| Appointment not saved | Webhook timeout | Increase timeout limit |
| Customer doesn't answer | Bad timing | Adjust call schedule |

## Cost Considerations

**ElevenLabs Pricing** (as of 2024):

- Conversational AI: ~$0.10-0.30 per minute of conversation
- Average call duration: 3-5 minutes
- Cost per customer: ~$0.30-1.50

**Stripe Fees**:

- 2.9% + $0.30 per transaction
- $250 deposit = $7.55 fee

**Total Cost Per Customer**: ~$8-9 for payment processing and AI follow-up

## Alternative Approaches

If full ElevenLabs integration is too complex initially, consider these alternatives:

### Option 1: Manual Follow-Up with Marina Assist

- Store customer data in database after payment
- Admin manually triggers Marina calls from ElevenLabs dashboard
- Marina still handles the conversation and scheduling
- Lower technical complexity, but requires manual intervention

### Option 2: Email-First Approach

- Send automated email after payment with booking link
- Only use Marina for customers who don't respond within 24 hours
- Reduces call volume and costs

### Option 3: SMS + Marina Combo

- Send SMS with booking link immediately after payment
- Marina calls only if no booking within 48 hours
- Balances automation with cost efficiency

## Support and Resources

**ElevenLabs Documentation**:
- Conversational AI API: https://elevenlabs.io/docs/api-reference/conversational-ai
- Agent Configuration: https://elevenlabs.io/docs/conversational-ai/agents
- Webhooks: https://elevenlabs.io/docs/conversational-ai/webhooks

**Stripe Documentation**:
- Webhooks Guide: https://stripe.com/docs/webhooks
- Payment Links: https://stripe.com/docs/payment-links
- Metadata: https://stripe.com/docs/api/metadata

**Manus Documentation**:
- Full-Stack Upgrade: Check Management UI → Settings → Features
- Environment Secrets: Management UI → Settings → Secrets
- Database Access: Management UI → Database

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Author**: Manus AI
