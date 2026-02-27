import express from 'express';
import { getQuoteByPhone } from './db';
import { triggerMarinaCall } from './elevenlabs';

const router = express.Router();

/**
 * Marina AI Context Webhook
 * 
 * ElevenLabs calls this endpoint to fetch customer context before making a call.
 * The response must be a valid conversation_initiation_client_data event.
 * 
 * Expected request body from ElevenLabs:
 * {
 *   "call_id": "string",
 *   "customer_phone_number": "+1234567890"
 * }
 */
router.post('/context', async (req, res) => {
  try {
    const { call_id, customer_phone_number } = req.body;

    console.log('[Marina] Context requested:', { call_id, customer_phone_number });

    // Find the most recent quote for this phone number
    const quote = await getQuoteByPhone(customer_phone_number);

    if (!quote) {
      console.log('[Marina] No quote found for phone:', customer_phone_number);
      
      // Return minimal context if no quote found
      return res.json({
        type: 'conversation_initiation_client_data',
        call_id,
        client_data: {
          customer_name: 'Valued Customer',
          message: 'No quote found for this customer. Please ask for their details.'
        }
      });
    }

    // Format services list from the services object
    const services = [];
    const servicesList = quote.services || {};
    if (servicesList.gelcoat) services.push('Gelcoat Restoration');
    if (servicesList.exterior) services.push('Exterior Detailing');
    if (servicesList.interior) services.push('Interior Detailing');
    if (servicesList.ceramic) services.push('Ceramic Coating');
    if (servicesList.graphene) services.push('Graphene Coating');
    if (servicesList.wetSanding) services.push('Wet Sanding');
    if (servicesList.bottomPainting) services.push('Bottom Painting');
    if (servicesList.vinyl) services.push('Vinyl Work');

    // Build comprehensive context for Marina
    const context = {
      type: 'conversation_initiation_client_data',
      call_id,
      client_data: {
        // Customer Information
        customer_name: quote.fullName,
        customer_email: quote.email,
        customer_phone: quote.phone,
        
        // Boat Details
        boat_length: `${quote.boatLength} feet`,
        boat_type: quote.boatType,
        service_location: quote.location,
        
        // Services Requested
        services_selected: services.join(', '),
        
        // Pricing
        subtotal: `$${quote.subtotal.toFixed(2)}`,
        total: `$${quote.total.toFixed(2)}`,
        deposit_amount: `$${quote.depositAmount.toFixed(2)}`,
        remaining_balance: `$${(quote.total - quote.depositAmount).toFixed(2)}`,
        
        // Payment Status
        deposit_paid: quote.depositPaid ? 'Yes' : 'No',
        payment_date: quote.depositPaid && quote.stripePaymentIntentId 
          ? new Date().toLocaleDateString() 
          : 'Not paid yet',
        
        // Quote Details
        quote_id: quote.id,
        quote_date: new Date(quote.createdAt).toLocaleDateString(),
        
        // Call Instructions for Marina
        call_purpose: quote.depositPaid 
          ? 'Thank the customer for their deposit payment and schedule the service. Confirm boat details and service location. Ask about preferred service dates.'
          : 'Follow up on the quote. Answer any questions about services and pricing. Encourage them to complete the deposit payment to schedule service.',
        
        // Additional Context
        notes: `Customer submitted quote for ${quote.boatLength}ft ${quote.boatType} at ${quote.location}. Selected ${services.length} service(s). ${quote.depositPaid ? 'Deposit paid - ready to schedule.' : 'Awaiting deposit payment.'}`
      }
    };

    console.log('[Marina] Sending context:', JSON.stringify(context, null, 2));

    res.json(context);
  } catch (error) {
    console.error('[Marina] Error fetching context:', error);
    
    // Return error in proper format
    res.status(500).json({
      type: 'conversation_initiation_client_data',
      call_id: req.body.call_id || 'unknown',
      client_data: {
        error: 'Failed to fetch customer context',
        message: 'Please proceed with general inquiry'
      }
    });
  }
});

/**
 * Cal.com BOOKING_CREATED Webhook
 * 
 * Cal.com calls this endpoint when a new booking is created.
 * We trigger a Marina AI call to welcome the customer and confirm details.
 * 
 * Set this URL in Cal.com: https://your-domain/api/marina/calcom-webhook
 */
router.post('/calcom-webhook', async (req, res) => {
  try {
    const payload = req.body;
    console.log('[Cal.com Webhook] Received event:', payload?.triggerEvent);

    const triggerEvent = payload?.triggerEvent;

    // Only handle BOOKING_CREATED and BOOKING_CANCELLED events
    if (triggerEvent !== 'BOOKING_CREATED' && triggerEvent !== 'BOOKING_CANCELLED') {
      return res.json({ received: true, action: 'ignored' });
    }

    const booking = payload.payload;
    if (!booking) {
      console.warn('[Cal.com Webhook] No payload data');
      return res.json({ received: true, action: 'no_payload' });
    }

    // Extract attendee info (first attendee is the customer)
    const attendee = booking.attendees?.[0];
    if (!attendee) {
      console.warn('[Cal.com Webhook] No attendee found in booking');
      return res.json({ received: true, action: 'no_attendee' });
    }

    const customerPhone = attendee.phoneNumber || attendee.phone;
    const customerName = attendee.name;
    const startTime = booking.startTime;

    if (!customerPhone) {
      console.warn('[Cal.com Webhook] No phone number for attendee:', customerName);
      return res.json({ received: true, action: 'no_phone' });
    }

    // Format the booking date/time for context
    const bookingDate = startTime
      ? new Date(startTime).toLocaleString('en-CA', {
          timeZone: attendee.timeZone || 'America/Toronto',
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true,
        })
      : 'your scheduled date';

    // Look up quote context for this customer
    let quoteContext: {
      boatLength?: number;
      boatType?: string;
      servicesSelected?: string;
      quoteTotal?: number;
    } = {};
    try {
      const quote = await getQuoteByPhone(customerPhone);
      if (quote) {
        const services: string[] = [];
        const s = quote.services || {};
        if (s.gelcoat) services.push('Gelcoat Restoration');
        if (s.exterior) services.push('Exterior Detailing');
        if (s.interior) services.push('Interior Detailing');
        if (s.ceramic) services.push('Ceramic Coating');
        if (s.graphene) services.push('Graphene Coating');
        if (s.wetSanding) services.push('Wet Sanding');
        if (s.bottomPainting) services.push('Bottom Painting');
        if (s.vinyl) services.push('Vinyl Work');
        quoteContext = {
          boatLength: quote.boatLength,
          boatType: quote.boatType,
          servicesSelected: services.join(', ') || 'boat detailing services',
          quoteTotal: quote.total,
        };
      }
    } catch (e) {
      console.warn('[Cal.com Webhook] Could not fetch quote for phone:', customerPhone);
    }

    // Build call context based on event type
    let callContext;
    if (triggerEvent === 'BOOKING_CREATED') {
      console.log('[Cal.com Webhook] BOOKING_CREATED — triggering welcome call for:', customerName);
      callContext = {
        customerName,
        boatLength: quoteContext.boatLength,
        boatType: quoteContext.boatType,
        quoteTotal: quoteContext.quoteTotal,
        depositAmount: 250,
        servicesSelected: `${quoteContext.servicesSelected || 'boat detailing services'} — appointment confirmed for ${bookingDate}`,
      };
    } else {
      // BOOKING_CANCELLED — Marina calls to understand why and attempt to re-book
      console.log('[Cal.com Webhook] BOOKING_CANCELLED — triggering re-booking call for:', customerName);
      callContext = {
        customerName,
        boatLength: quoteContext.boatLength,
        boatType: quoteContext.boatType,
        quoteTotal: quoteContext.quoteTotal,
        depositAmount: 250,
        servicesSelected: `${quoteContext.servicesSelected || 'boat detailing services'} — CANCELLED appointment was on ${bookingDate}. Purpose of this call: understand why the customer cancelled and offer to reschedule at a more convenient time.`,
      };
    }

    const callResult = await triggerMarinaCall(customerPhone, callContext);

    if (callResult.success) {
      console.log(`[Cal.com Webhook] Marina ${triggerEvent} call triggered:`, callResult.conversationId);
    } else {
      console.error(`[Cal.com Webhook] Marina ${triggerEvent} call failed:`, callResult.error);
    }

    res.json({ received: true, action: 'call_triggered', event: triggerEvent, success: callResult.success });
  } catch (error) {
    console.error('[Cal.com Webhook] Error:', error);
    res.status(500).json({ received: false, error: 'Internal server error' });
  }
});

export default router;
