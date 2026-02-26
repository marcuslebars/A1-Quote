/**
 * ElevenLabs Conversational AI Integration
 * Triggers Marina AI calls with customer context via Twilio
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const ELEVENLABS_PHONE_NUMBER_ID = process.env.ELEVENLABS_PHONE_NUMBER_ID;

interface MarinaCallContext {
  customerName?: string;
  boatLength?: number;
  boatType?: string;
  servicesSelected?: string;
  quoteTotal?: number;
  depositAmount?: number;
}

export async function triggerMarinaCall(
  phoneNumber: string,
  context?: MarinaCallContext
) {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID || !ELEVENLABS_PHONE_NUMBER_ID) {
    console.error('[ElevenLabs] Missing credentials:', {
      hasApiKey: !!ELEVENLABS_API_KEY,
      hasAgentId: !!ELEVENLABS_AGENT_ID,
      hasPhoneNumberId: !!ELEVENLABS_PHONE_NUMBER_ID
    });
    return { 
      success: false, 
      error: 'Missing ElevenLabs credentials. Please contact support.' 
    };
  }

  try {
    // Format phone number to E.164 format: +1234567890
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+1${phoneNumber.replace(/\D/g, '')}`;

    console.log('[ElevenLabs] Triggering call to:', formattedPhone);
    console.log('[ElevenLabs] Context data:', context);
    console.log('[ElevenLabs] Dynamic variables:', {
      customer_name: context?.customerName || 'valued customer',
      boat_length: context?.boatLength || 0,
      boat_type: context?.boatType || 'boat',
      services_selected: context?.servicesSelected || 'boat detailing services',
      quote_total: context?.quoteTotal || 0,
      deposit_amount: context?.depositAmount || 0,
    });

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/twilio/outbound-call`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          agent_id: ELEVENLABS_AGENT_ID,
          agent_phone_number_id: ELEVENLABS_PHONE_NUMBER_ID,
          to_number: formattedPhone,
          ...(context && {
            conversation_initiation_client_data: {
              dynamic_variables: {
                customer_name: context.customerName || 'valued customer',
                boat_length: context.boatLength || 0,
                boat_type: context.boatType || 'boat',
                services_selected: context.servicesSelected || 'boat detailing services',
                quote_total: context.quoteTotal || 0,
                deposit_amount: context.depositAmount || 0,
              },
            },
          }),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API error:', response.status, errorText);
      return { 
        success: false, 
        error: `ElevenLabs API error: ${response.status} - ${errorText}` 
      };
    }

    const data = await response.json();
    console.log('[ElevenLabs] Call initiated successfully:', data);

    return { 
      success: true, 
      conversationId: data.conversation_id,
      callSid: data.callSid,
      data 
    };
  } catch (error) {
    console.error('[ElevenLabs] Failed to trigger call:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
