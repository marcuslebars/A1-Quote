import express from 'express';
import { getQuoteByPhone } from './db';

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

export default router;
