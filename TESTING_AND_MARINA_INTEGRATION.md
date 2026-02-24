# Testing Payments & Marina AI Integration Guide

## Testing Stripe Payments Without Real Money

Stripe provides **test mode** that allows you to simulate payments without charging real money.

### Test Card Numbers

Use these card numbers in your Stripe checkout:

| Scenario | Card Number | Expiry | CVC | ZIP |
|----------|-------------|--------|-----|-----|
| **Successful Payment** | `4242 4242 4242 4242` | Any future date | Any 3 digits | Any 5 digits |
| **Requires Authentication** | `4000 0025 0000 3155` | Any future date | Any 3 digits | Any 5 digits |
| **Declined** | `4000 0000 0000 0002` | Any future date | Any 3 digits | Any 5 digits |
| **Insufficient Funds** | `4000 0000 0000 9995` | Any future date | Any 3 digits | Any 5 digits |

### Testing Flow

1. **Submit a quote** at https://quote.a1marinecare.ca
2. **Click the deposit button** - you'll be redirected to Stripe
3. **Use test card** `4242 4242 4242 4242` with any future expiry and CVC
4. **Complete payment** - Stripe will process it as a test transaction
5. **Check webhook logs** in Railway to see the payment confirmation

---

## Setting Up Stripe Webhook

The webhook receives payment confirmations from Stripe and triggers Marina AI to call the customer.

### Step 1: Configure Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter webhook URL: `https://quote.a1marinecare.ca/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_...`)

### Step 2: Add Webhook Secret to Railway

1. Go to Railway project → **Variables** tab
2. Add new variable:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_...` (the signing secret from Step 1)
3. Railway will auto-redeploy

### Step 3: Enable Webhook Signature Verification (Production)

The webhook handler currently accepts all requests. For production, you should verify Stripe's signature:

1. Uncomment the secure webhook handler in `server/stripe.ts` (lines 81-104)
2. Update `server/index.ts` to use `handleStripeWebhookSecure` instead of `handleStripeWebhook`
3. Redeploy

---

## Marina AI Integration

When a payment succeeds, the webhook automatically:

1. **Updates the quote** in MongoDB (marks `depositPaid: true`)
2. **Fetches customer details** from the database
3. **Prepares context** for Marina AI with:
   - Customer name, phone, email
   - Boat details (length, type, location)
   - Services selected
   - Estimated total
   - Quote ID

### Current Implementation

The webhook handler logs the Marina context but doesn't make the API call yet:

```typescript
const marinaContext = {
  customerName: quote.fullName,
  customerPhone: quote.phone,
  customerEmail: quote.email,
  boatDetails: {
    length: quote.boatLength,
    type: quote.boatType,
    location: quote.location,
  },
  servicesSelected: quote.services,
  estimatedTotal: quote.total,
  depositPaid: true,
  quoteId: quote.id,
};

console.log('[Marina AI] Would trigger call with context:', marinaContext);
```

### Integrating with Marina AI API

To enable Marina AI to call customers after payment:

#### Option 1: Direct ElevenLabs API Call

If Marina uses ElevenLabs directly:

```typescript
// In server/stripe.ts, replace the TODO section with:
const response = await fetch('https://api.elevenlabs.io/v1/convai/conversation', {
  method: 'POST',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY!,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    agent_id: process.env.MARINA_AGENT_ID,
    phone_number: quote.phone,
    context: marinaContext,
  }),
});
```

**Environment Variables Needed:**
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `MARINA_AGENT_ID`: Marina's agent ID in ElevenLabs

#### Option 2: Custom Marina API Endpoint

If you have a custom Marina API:

```typescript
// In server/stripe.ts, replace the TODO section with:
await fetch('https://your-marina-api.com/trigger-call', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.MARINA_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(marinaContext),
});
```

**Environment Variables Needed:**
- `MARINA_API_KEY`: Your Marina API authentication key

#### Option 3: Queue-Based System (Recommended for Production)

For reliability, use a queue system:

1. **Add quote to call queue** in MongoDB:
```typescript
await CallQueue.create({
  quoteId: quote.id,
  customerPhone: quote.phone,
  context: marinaContext,
  status: 'pending',
  attempts: 0,
});
```

2. **Background worker** processes the queue and triggers Marina calls
3. **Retry logic** for failed calls
4. **Status tracking** (pending → calling → completed → failed)

---

## Testing the Complete Flow

### End-to-End Test

1. **Submit a quote** at https://quote.a1marinecare.ca
   - Boat: 30ft Cruiser
   - Services: Gelcoat Restoration
   - Contact: Your test email/phone

2. **Complete payment** with test card `4242 4242 4242 4242`

3. **Check Railway logs** for:
   ```
   [Stripe Webhook] Received event: checkout.session.completed
   [Stripe Webhook] Quote abc123 marked as paid
   [Marina AI] Would trigger call with context: { ... }
   ```

4. **Verify in MongoDB** that the quote has:
   - `depositPaid: true`
   - `stripeSessionId: "cs_test_..."`
   - `stripePaymentIntentId: "pi_..."`

5. **Once Marina API is connected**, verify Marina receives the call trigger

---

## Troubleshooting

### Webhook Not Receiving Events

- **Check Stripe Dashboard** → Webhooks → Your endpoint → "Recent deliveries"
- **Verify URL** is correct: `https://quote.a1marinecare.ca/api/webhooks/stripe`
- **Check Railway logs** for incoming webhook requests
- **Test webhook** using Stripe's "Send test webhook" button

### Marina Not Calling Customer

- **Check logs** for `[Marina AI]` messages
- **Verify API credentials** are set in Railway environment variables
- **Test Marina API** independently with a curl request
- **Check phone number format** (should be E.164 format: +1234567890)

### Quote Not Updating

- **Check MongoDB connection** in Railway logs
- **Verify quote ID** is being passed correctly
- **Check database** directly in MongoDB Atlas

---

## Next Steps

1. **Test payment flow** with test card
2. **Verify webhook receives events** in Railway logs
3. **Choose Marina integration option** (ElevenLabs, custom API, or queue)
4. **Add environment variables** for Marina API
5. **Uncomment API call code** in `server/stripe.ts`
6. **Test end-to-end** with real Marina call
7. **Enable webhook signature verification** for production

---

## Security Notes

- **Always verify webhook signatures** in production
- **Never expose API keys** in client-side code
- **Use HTTPS** for all webhook endpoints
- **Rate limit** webhook endpoint to prevent abuse
- **Log all webhook events** for debugging and audit trails
