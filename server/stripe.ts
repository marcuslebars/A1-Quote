import { Request, Response } from "express";
import { updateQuotePaymentStatus, getQuoteById } from "./db";

/**
 * Stripe webhook handler for payment confirmations
 * 
 * This endpoint receives events from Stripe when payments are completed.
 * Configure this URL in your Stripe Dashboard under Webhooks:
 * https://your-domain.com/api/webhooks/stripe
 * 
 * Events to listen for:
 * - checkout.session.completed
 * - payment_intent.succeeded
 * - payment_intent.payment_failed
 */

export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    // In production, verify the webhook signature using Stripe's library
    // For now, we'll accept the payload directly
    
    const event = req.body;

    console.log("[Stripe Webhook] Received event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        
        // Extract quote ID from metadata (we'll add this when creating the checkout)
        const quoteId = session.metadata?.quoteId;
        const paymentIntentId = session.payment_intent;

        if (quoteId && paymentIntentId) {
          await updateQuotePaymentStatus(quoteId, {
            depositPaid: true,
            stripePaymentIntentId: paymentIntentId as string,
            stripeSessionId: session.id,
          });
          
          console.log(`[Stripe Webhook] Quote ${quoteId} marked as paid`);
          
          // Trigger Marina AI to call customer
          try {
            const quote = await getQuoteById(quoteId);
            if (quote) {
              // TODO: Replace with actual Marina AI API endpoint
              // This would trigger Marina to call the customer with context
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
              
              // Example API call (uncomment when Marina API is ready):
              // await fetch('https://marina-api.example.com/trigger-call', {
              //   method: 'POST',
              //   headers: { 'Content-Type': 'application/json' },
              //   body: JSON.stringify(marinaContext),
              // });
            }
          } catch (error) {
            console.error('[Marina AI] Failed to trigger call:', error);
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("[Stripe Webhook] Payment succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log("[Stripe Webhook] Payment failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Verify Stripe webhook signature (for production use)
 * 
 * To use this, you'll need to:
 * 1. Install stripe package: pnpm add stripe
 * 2. Add STRIPE_WEBHOOK_SECRET to environment variables
 * 3. Uncomment the verification code below
 */

/*
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function handleStripeWebhookSecure(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Process the verified event
  // ... (same switch logic as above)
}
*/
