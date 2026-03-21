import Stripe from "stripe";
import { Request, Response } from "express";
import { updateQuotePaymentStatus, getQuoteById, createBooking } from "./db";
import { triggerMarinaCall } from "./elevenlabs";
import { sendBookingConfirmationEmail } from "./email";

/**
 * Stripe webhook handler for payment confirmations.
 *
 * Configure this URL in your Stripe Dashboard under Webhooks:
 *   https://quote.a1marinecare.ca/api/webhooks/stripe
 *
 * Events to listen for:
 *   - checkout.session.completed
 *   - payment_intent.succeeded
 *   - payment_intent.payment_failed
 *
 * The webhook handles deposits coming from TWO sources:
 *   1. A1-Quote (legacy): checkout sessions created by the quote app directly.
 *   2. a1-booking: checkout sessions created by the booking portal after Calendly scheduling.
 *
 * Both paths share the same Stripe account, so both fire to this webhook.
 * We distinguish them by the presence of `metadata.quoteId` (legacy) vs
 * `metadata.customerEmail` (booking portal).
 */

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export async function handleStripeWebhook(req: Request, res: Response) {
  try {
    let event: Stripe.Event;

    // ── Signature verification ──────────────────────────────────────────────
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const sig = req.headers["stripe-signature"] as string | undefined;

    if (webhookSecret && sig) {
      try {
        event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // Fallback: accept raw body (dev / no-secret environments)
      console.warn("[Stripe Webhook] No STRIPE_WEBHOOK_SECRET — skipping signature verification");
      event = req.body as Stripe.Event;
    }

    console.log("[Stripe Webhook] Received event:", event.type);

    switch (event.type) {
      // ── Checkout session completed ─────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const meta = session.metadata || {};
        const paymentIntentId = session.payment_intent as string | undefined;

        // ── Path 1: legacy quote-app deposit ──────────────────────────────
        const quoteId = meta.quoteId;
        if (quoteId) {
          // Mark the quote as paid
          await updateQuotePaymentStatus(quoteId, {
            depositPaid: true,
            stripePaymentIntentId: paymentIntentId,
            stripeSessionId: session.id,
          });
          console.log(`[Stripe Webhook] Quote ${quoteId} marked as paid`);

          // Trigger Marina AI call
          try {
            const quote = await getQuoteById(quoteId);
            if (quote?.phone) {
              const result = await triggerMarinaCall(quote.phone);
              if (result.success) {
                console.log("[Marina AI] Call initiated:", result.conversationId);
              } else {
                console.error("[Marina AI] Failed to initiate call:", result.error);
              }
            }
          } catch (err) {
            console.error("[Marina AI] Error triggering call:", err);
          }
        }

        // ── Path 2: booking-portal deposit (new flow) ─────────────────────
        // The booking portal sends customerEmail, customerName, services, etc.
        // in metadata. We send the thank-you email here.
        const customerEmail = meta.customerEmail || session.customer_email;
        const customerName = meta.customerName;

        if (customerEmail && customerName) {
          console.log(`[Stripe Webhook] Deposit received for ${customerEmail} — sending thank-you email`);

          // Parse services from metadata
          let servicesLabel = "Boat detailing services";
          try {
            const parsed = JSON.parse(meta.services || "[]") as Array<{ name: string; price: number }>;
            if (parsed.length > 0) {
              servicesLabel = parsed.map((s) => s.name).join(", ");
            }
          } catch (_) {
            // keep default
          }

          // Persist a booking record so it shows in the admin dashboard
          try {
            await createBooking({
              quoteId: meta.quoteId || quoteId || undefined,
              customerName,
              customerEmail,
              customerPhone: meta.customerPhone || "",
              startTime: new Date(), // Calendly sets the real time; this is a placeholder
              services: servicesLabel,
              location: meta.serviceLocation || "",
            });
            console.log("[Stripe Webhook] Booking record created for", customerEmail);
          } catch (err) {
            console.error("[Stripe Webhook] Failed to create booking record:", err);
          }

          // Send thank-you / confirmation email
          try {
            await sendBookingConfirmationEmail({
              customerName,
              customerEmail,
              // We don't have the exact appointment time here (Calendly holds it),
              // so we use the current time as a placeholder. The Calendly confirmation
              // email already contains the exact date/time.
              startTime: new Date().toISOString(),
              services: servicesLabel,
              location: meta.serviceLocation || "Your marina",
            });
            console.log("[Stripe Webhook] Thank-you email sent to", customerEmail);
          } catch (err) {
            console.error("[Stripe Webhook] Failed to send thank-you email:", err);
          }
        }

        break;
      }

      // ── Payment intent events ──────────────────────────────────────────────
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("[Stripe Webhook] Payment intent succeeded:", pi.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("[Stripe Webhook] Payment intent failed:", pi.id);
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
