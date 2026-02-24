/**
 * ElevenLabs Conversational AI Integration
 * Triggers Marina AI calls with customer context
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

export async function triggerMarinaCall(phoneNumber: string) {
  if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
    console.error('[ElevenLabs] Missing credentials - ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID not set');
    return { success: false, error: 'Missing ElevenLabs credentials' };
  }

  try {
    console.log('[ElevenLabs] Triggering call to:', phoneNumber);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          agent_id: ELEVENLABS_AGENT_ID,
          // Phone number should be in E.164 format: +1234567890
          phone_number: phoneNumber.startsWith('+') ? phoneNumber : `+1${phoneNumber.replace(/\D/g, '')}`,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API error:', response.status, errorText);
      return { 
        success: false, 
        error: `ElevenLabs API error: ${response.status} ${errorText}` 
      };
    }

    const data = await response.json();
    console.log('[ElevenLabs] Call initiated successfully:', data);

    return { 
      success: true, 
      conversationId: data.conversation_id,
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
