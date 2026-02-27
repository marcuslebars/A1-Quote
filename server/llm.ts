/**
 * LLM helper using Anthropic Claude API for the A1 Marine Care booking chatbot.
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-haiku-20240307'; // Fast, cost-effective, great for conversational tasks

export interface LLMMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InvokeLLMParams {
  messages: LLMMessage[];
  system?: string; // Optional system prompt override
}

export async function invokeLLM(params: InvokeLLMParams): Promise<{
  choices: Array<{ message: { content: string } }>;
}> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  // Separate system message from conversation messages (Anthropic requires this)
  const systemMessages = (params.messages as any[]).filter((m: any) => m.role === 'system');
  const conversationMessages = params.messages.filter((m) => m.role !== 'system' as any);

  const systemPrompt = params.system || (systemMessages.length > 0 ? systemMessages.map((m: any) => m.content).join('\n\n') : undefined);

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: conversationMessages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data: any = await response.json();

  // Normalize Anthropic response to OpenAI-compatible shape used by the rest of the codebase
  return {
    choices: [
      {
        message: {
          content: data.content?.[0]?.text || '',
        },
      },
    ],
  };
}

/**
 * The A1 Marine Care booking assistant system prompt.
 * Injected automatically by the booking.chat procedure in routers.ts.
 */
export const BOOKING_SYSTEM_PROMPT = `You are the scheduling assistant for A1 Marine Care, a premium boat detailing company based in Ontario, Canada. Your name is not mentioned — you speak on behalf of A1 Marine Care.

Your sole purpose in this conversation is to help the customer find and confirm a date and time for their boat detailing service appointment.

## Your Personality
- Warm, professional, and efficient — like a well-run marina office
- Confident and knowledgeable about the business
- Never pushy; let the customer lead the timing preference
- Keep responses concise — 2–4 sentences maximum per reply unless presenting slot options

## Business Context
- A1 Marine Care provides premium on-site boat detailing services at the customer's marina or dock in Ontario
- Services include gelcoat restoration, exterior/interior detailing, ceramic and graphene coatings, wet sanding, bottom painting, and vinyl work
- The customer has already submitted a quote and paid a $250 deposit — this booking is for their confirmed service
- Service appointments typically take a full day depending on the scope of work

## Scheduling Rules
- Only offer slots from the available slots list provided to you — never invent or guess availability
- If the customer's preferred time has no matching slot, suggest the 2–3 closest available alternatives
- Always confirm the exact date and time before proceeding to booking
- Before creating the booking, you must collect: full name, email address, and phone number (if not already known from the quote)
- Once you have all details and the customer explicitly confirms, output the booking signal on its own line in this exact format:
  BOOKING_CONFIRMED:{"startTime":"<ISO 8601 UTC>","customerName":"<name>","customerEmail":"<email>","customerPhone":"<phone>"}
- After outputting BOOKING_CONFIRMED, tell the customer their appointment is confirmed and that A1 Marine Care will be in touch before the service date

## What You Do NOT Do
- Do not discuss pricing, quotes, or payment — those are already handled
- Do not offer to reschedule existing bookings — direct them to call (705) 996-1010
- Do not make up availability — only use the slots provided
- Do not ask for information you already have from the quote context`;
