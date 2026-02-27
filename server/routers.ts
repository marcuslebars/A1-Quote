import { z } from "zod";
import { createQuote, getAllQuotes, getQuoteById, getQuoteByPhone, getQuoteByStripeSessionId } from "./db";
import { publicProcedure, router } from "./trpc";
import { triggerMarinaCall } from "./elevenlabs";
import { createCalComBooking, getCalComAvailability } from "./calcom";

export const appRouter = router({
  quotes: router({
    // Submit a new quote
    submit: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(1),
          customerEmail: z.string().email(),
          customerPhone: z.string().min(1),
          boatLength: z.number().positive(),
          boatType: z.string().min(1),
          serviceLocation: z.string().min(1),
          estimatedTotal: z.number().nonnegative(),
          requiresManualReview: z.boolean(),
          reviewReasons: z.array(z.string()).optional(),
          servicesConfig: z.any(),
        })
      )
      .mutation(async ({ input }) => {
        const quote = await createQuote({
          fullName: input.customerName,
          email: input.customerEmail,
          phone: input.customerPhone,
          boatLength: input.boatLength,
          boatType: input.boatType,
          location: input.serviceLocation,
          subtotal: input.estimatedTotal,
          tax: 0,
          total: input.estimatedTotal,
          depositAmount: 25000, // $250 in cents
          services: {
            config: input.servicesConfig,
            requiresManualReview: input.requiresManualReview,
            reviewReasons: input.reviewReasons || [],
          },
        });

        return {
          success: true,
          quoteId: quote.id,
        };
      }),

    // Get quote by ID
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const quote = await getQuoteById(input.id);
        if (!quote) {
          throw new Error("Quote not found");
        }
        return quote;
      }),

    // Get all quotes (for admin dashboard)
    list: publicProcedure.query(async () => {
      return await getAllQuotes();
    }),

    // Get quote by Stripe session ID
    getBySessionId: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const quote = await getQuoteByStripeSessionId(input.sessionId);
        if (!quote) {
          throw new Error("Quote not found for this session");
        }
        return quote;
      }),
  }),

  booking: router({
    // Get available Cal.com slots for a date range
    getAvailability: publicProcedure
      .input(z.object({
        startTime: z.string(), // ISO 8601 UTC
        endTime: z.string(),   // ISO 8601 UTC
        timeZone: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const result = await getCalComAvailability({
          startTime: input.startTime,
          endTime: input.endTime,
          timeZone: input.timeZone,
        });
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch availability');
        }
        return { slots: result.slots };
      }),

    // AI chat: parse natural language, check availability, confirm, then book
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })),
        quoteId: z.string().optional(),
        timeZone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const tz = input.timeZone || 'America/Toronto';
        const now = new Date();
        // Fetch next 14 days of availability to give the LLM context
        const windowStart = now.toISOString();
        const windowEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();

        let availabilityContext = '';
        try {
          const avail = await getCalComAvailability({ startTime: windowStart, endTime: windowEnd, timeZone: tz });
          if (avail.slots.length > 0) {
            // Format slots in a human-readable way
            const formatted = avail.slots.slice(0, 40).map(s => {
              const d = new Date(s);
              return d.toLocaleString('en-CA', { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
            });
            availabilityContext = `Available slots in the next 14 days (${tz}):\n${formatted.join('\n')}`;
          } else {
            availabilityContext = 'No available slots found in the next 14 days.';
          }
        } catch (e) {
          availabilityContext = 'Could not fetch live availability right now.';
        }

        // Fetch quote data for context if quoteId provided
        let quoteContext = '';
        if (input.quoteId) {
          try {
            const q = await getQuoteById(input.quoteId);
            if (q) {
              quoteContext = `Customer quote: ${q.boatLength}ft ${q.boatType}, services: ${JSON.stringify(q.services?.config || {})}, total: $${((q.total || 0) / 100).toFixed(2)}, name: ${q.fullName}, email: ${q.email}, phone: ${q.phone}.`;
            }
          } catch {}
        }

        const systemPrompt = `You are a friendly booking assistant for A1 Marine Care, a premium boat detailing company in Ontario, Canada.

Your job is to help the customer schedule their boat detailing service.

${quoteContext}

${availabilityContext}

Instructions:
- Help the customer find a suitable date and time from the available slots above.
- When the customer expresses a preferred time, check if it matches an available slot. If not, suggest the closest available alternatives (show 2-3 options).
- When the customer confirms a specific slot, respond with a JSON block in this exact format on its own line:
  BOOKING_CONFIRMED:{"startTime":"<ISO 8601 UTC>","customerName":"<name>","customerEmail":"<email>","customerPhone":"<phone>"}
- Only include the BOOKING_CONFIRMED line when the customer has explicitly confirmed a specific slot AND you have their name, email, and phone.
- If you are missing contact details, ask for them before confirming.
- Be warm, professional, and concise. Do not repeat the full list of slots unless asked.
- Today is ${now.toLocaleDateString('en-CA', { timeZone: tz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} in ${tz}.`;

        const { invokeLLM } = await import('./llm');
        const llmResponse = await invokeLLM({
          messages: [
            { role: 'system', content: systemPrompt },
            ...input.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          ],
        });

        const content: string = llmResponse.choices?.[0]?.message?.content || 'I apologize, I could not process your request. Please try again.';

        // Check if the LLM included a booking confirmation signal
        const bookingMatch = content.match(/BOOKING_CONFIRMED:(\{.*?\})/);
        if (bookingMatch) {
          try {
            const bookingData = JSON.parse(bookingMatch[1]);
            const bookingResult = await createCalComBooking({
              customerName: bookingData.customerName,
              customerEmail: bookingData.customerEmail,
              customerPhone: bookingData.customerPhone,
              startTime: bookingData.startTime,
              timeZone: tz,
            });

            // Strip the raw BOOKING_CONFIRMED line from the reply
            const cleanContent = content.replace(/BOOKING_CONFIRMED:\{.*?\}/, '').trim();

            return {
              reply: cleanContent,
              booked: bookingResult.success,
              bookingDetails: bookingResult.success ? {
                bookingId: bookingResult.bookingId,
                startTime: bookingResult.startTime,
                endTime: bookingResult.endTime,
              } : null,
              bookingError: bookingResult.success ? null : bookingResult.error,
            };
          } catch (parseErr) {
            console.error('[Booking Chat] Failed to parse booking data:', parseErr);
          }
        }

        return { reply: content, booked: false, bookingDetails: null, bookingError: null };
      }),
  }),

  marina: router({
    // Request a call from Marina (using quote ID)
    requestCall: publicProcedure
      .input(z.object({ quoteId: z.string() }))
      .mutation(async ({ input }) => {
        // Get quote details
        const quote = await getQuoteById(input.quoteId);
        if (!quote) {
          throw new Error("Quote not found");
        }

        // Trigger ElevenLabs call
        const result = await triggerMarinaCall(quote.phone);

        if (!result.success) {
          throw new Error(result.error || 'Failed to trigger Marina call');
        }

        return {
          success: true,
          conversationId: result.conversationId,
        };
      }),

    // Request a call from Marina (using phone number directly)
    requestCallByPhone: publicProcedure
      .input(z.object({ 
        phoneNumber: z.string().min(10),
        customerName: z.string().optional(),
        boatLength: z.number().optional(),
        boatType: z.string().optional(),
        servicesSelected: z.string().optional(),
        quoteTotal: z.number().optional(),
        depositAmount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        console.log('[Marina] requestCallByPhone received:', input);
        
        // Trigger ElevenLabs call with provided phone number and context
        const result = await triggerMarinaCall(input.phoneNumber, {
          customerName: input.customerName,
          boatLength: input.boatLength,
          boatType: input.boatType,
          servicesSelected: input.servicesSelected,
          quoteTotal: input.quoteTotal,
          depositAmount: input.depositAmount,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to trigger Marina call');
        }

        return {
          success: true,
          conversationId: result.conversationId,
        };
      }),

    // Create Cal.com booking (called by Marina during phone call)
    createBooking: publicProcedure
      .input(
        z.object({
          customerName: z.string().min(1),
          customerEmail: z.string().email(),
          customerPhone: z.string().min(10),
          startTime: z.string(), // ISO 8601 format in UTC
          timeZone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createCalComBooking({
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          startTime: input.startTime,
          timeZone: input.timeZone,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create booking');
        }

        return {
          success: true,
          bookingId: result.bookingId,
          bookingUid: result.bookingUid,
          startTime: result.startTime,
          endTime: result.endTime,
          meetingUrl: result.meetingUrl,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
