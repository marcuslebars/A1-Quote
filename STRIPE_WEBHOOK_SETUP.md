# Stripe Webhook Configuration Guide

This document explains how to configure Stripe webhooks to track payment confirmations for the A1 Marine Care quote system.

## Overview

When customers pay the $250 deposit through Stripe Payment Links, Stripe sends webhook events to your server to confirm the payment. This allows the system to:

1. Update the quote's payment status in the database
2. Trigger Marina AI agent to call the customer
3. Track payment history for admin dashboard

## Webhook Endpoint

**URL**: `https://your-domain.com/api/webhooks/stripe`

This endpoint is already implemented in `server/stripe.ts` and registered in `server/_core/index.ts`.

## Stripe Dashboard Configuration

### Step 1: Access Webhook Settings

1. Log into [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**

### Step 2: Configure Endpoint

**Endpoint URL**: Enter your production domain
```
https://a1marinecare.manus.space/api/webhooks/stripe
```

**Events to listen for**:
- ✅ `checkout.session.completed` (primary event)
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

**API Version**: Use the latest version (currently 2024-11-20)

### Step 3: Save Webhook Secret

After creating the webhook, Stripe will provide a **Signing Secret** (starts with `whsec_...`).

**Important**: Save this secret securely. You'll need it for production webhook verification.

## Development Testing

### Using Stripe CLI

For local development, use the Stripe CLI to forward webhook events:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will output a webhook signing secret for testing.

### Manual Testing

You can manually test the webhook by sending a POST request:

```bash
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_123",
        "payment_intent": "pi_test_456",
        "metadata": {
          "quoteId": "1"
        }
      }
    }
  }'
```

## Payment Link Metadata

**Critical**: When creating Stripe Payment Links, you MUST include the `quoteId` in the metadata so the webhook can identify which quote to update.

### Current Implementation

The current Stripe Payment Link (`https://buy.stripe.com/4gM3cvetybh54ao8Tjgbm01`) is a **fixed link** that does NOT include quote-specific metadata.

### Recommended Upgrade

To properly track payments per quote, you have two options:

#### Option A: Dynamic Checkout Sessions (Recommended)

Replace the fixed payment link with dynamic Stripe Checkout Sessions:

```typescript
// Install Stripe SDK: pnpm add stripe
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create checkout session with quote metadata
const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  line_items: [{
    price_data: {
      currency: "usd",
      product_data: {
        name: "A1 Marine Care - Service Deposit",
        description: "Refundable deposit applied to final invoice",
      },
      unit_amount: 25000, // $250.00
    },
    quantity: 1,
  }],
  mode: "payment",
  success_url: `${process.env.FRONTEND_URL}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.FRONTEND_URL}/?canceled=true`,
  metadata: {
    quoteId: quoteId.toString(),
    customerEmail: customerEmail,
    boatLength: boatLength.toString(),
  },
});

// Redirect customer to session.url
```

#### Option B: Payment Link with URL Parameters

Keep using Payment Links but append quote ID as URL parameter:

```typescript
const paymentUrl = `https://buy.stripe.com/4gM3cvetybh54ao8Tjgbm01?client_reference_id=${quoteId}`;
```

Then update the webhook handler to read `client_reference_id` instead of `metadata.quoteId`.

## Webhook Security (Production)

For production, you MUST verify webhook signatures to prevent fraudulent requests.

### Step 1: Add Environment Variable

Add your webhook signing secret to environment variables:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### Step 2: Enable Signature Verification

Uncomment the secure webhook handler in `server/stripe.ts`:

```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Process verified event...
}
```

## Marina AI Integration

After payment confirmation, the webhook should trigger Marina AI to call the customer.

### ElevenLabs Integration Point

In `server/stripe.ts`, add Marina AI trigger after payment confirmation:

```typescript
case "checkout.session.completed": {
  const session = event.data.object;
  const quoteId = session.metadata?.quoteId;
  
  if (quoteId) {
    // Update database
    await updateQuotePaymentStatus(parseInt(quoteId), paymentIntentId, "paid");
    
    // Trigger Marina AI agent
    const quote = await getQuoteById(parseInt(quoteId));
    if (quote) {
      await triggerMarinaAICall({
        customerName: quote.customerName,
        customerPhone: quote.customerPhone,
        quoteId: quote.id,
        estimatedTotal: quote.estimatedTotal / 100, // convert cents to dollars
      });
    }
  }
  break;
}
```

See `ELEVENLABS_INTEGRATION_GUIDE.md` for complete Marina AI setup instructions.

## Testing Checklist

- [ ] Webhook endpoint responds with 200 OK
- [ ] Payment events are logged in server console
- [ ] Quote payment status updates in database
- [ ] Customer receives thank you page after payment
- [ ] Marina AI agent is triggered (when implemented)
- [ ] Webhook signature verification works in production

## Troubleshooting

### Webhook Not Receiving Events

1. Check Stripe Dashboard → Webhooks → Recent deliveries
2. Verify endpoint URL is correct and publicly accessible
3. Check server logs for incoming requests
4. Ensure firewall allows incoming HTTPS traffic

### Signature Verification Fails

1. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
2. Ensure webhook endpoint receives raw body (not parsed JSON)
3. Check that `express.raw()` middleware is applied before `express.json()`

### Quote Not Updating

1. Verify `quoteId` is present in webhook payload metadata
2. Check database connection and schema
3. Review server logs for error messages
4. Test with manual webhook event using Stripe CLI

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
