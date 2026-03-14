import { z } from "zod";
import { createQuote, getAllQuotes, getQuoteById, getQuoteByPhone, getQuoteByStripeSessionId, createBooking } from "./db";
import { publicProcedure, router } from "./trpc";
import { triggerMarinaCall } from "./elevenlabs";
import { createCalComBooking, getCalComAvailability } from "./calcom";
import { sendBookingConfirmationEmail, sendInteriorPhotoRequestEmail } from "./email";

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

        // If interior service is selected, send photo request email
        if (input.servicesConfig?.selectedServices?.interior) {
          try {
            await sendInteriorPhotoRequestEmail({
              customerName: input.customerName,
              customerEmail: input.customerEmail,
              boatLength: input.boatLength,
              boatType: input.boatType,
              serviceLocation: input.serviceLocation,
            });
            console.log('[Quote] Interior photo request email sent to', input.customerEmail);
          } catch (error: any) {
            console.error('[Quote] Failed to send interior photo request email:', error.message);
            // Don't fail the quote submission if email fails
          }
        }

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
              // Format services into a readable list
              const serviceNames: string[] = [];
              if (q.services) {
                const svc = q.services as Record<string, any>;
                if (svc.gelcoat) serviceNames.push(`Gelcoat Restoration (${svc.gelcoat.area || 'hull'})`);
                if (svc.exterior) serviceNames.push(`Exterior Detailing (${svc.exterior.tier || 'standard'} tier)`);
                if (svc.interior) serviceNames.push(`Interior Detailing (${svc.interior.tier || 'standard'} tier)`);
                if (svc.ceramic) serviceNames.push('Ceramic Coating');
                if (svc.graphene) serviceNames.push('Graphene Coating');
                if (svc.wetSanding) serviceNames.push('Wet Sanding');
                if (svc.bottomPainting) serviceNames.push('Bottom Painting');
                if (svc.vinyl) serviceNames.push(`Vinyl Wrap (${svc.vinyl.service || 'removal'})`);
              }
              const servicesStr = serviceNames.length > 0 ? serviceNames.join(', ') : 'boat detailing services';
              // total is stored in dollars (not cents)
              const totalStr = q.total > 0 ? `$${q.total.toFixed(2)}` : 'to be confirmed';
              quoteContext = `CUSTOMER QUOTE DETAILS:
- Customer name: ${q.fullName}
- Email: ${q.email}
- Phone: ${q.phone}
- Boat: ${q.boatLength}ft ${q.boatType}
- Service location: ${q.location}
- Services booked: ${servicesStr}
- Quote total: ${totalStr}
- Deposit paid: $${q.depositAmount || 250}.00

Use the customer's actual name, phone, email, and services listed above. Do NOT invent or guess any service details.`;
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

        const { invokeLLM, BOOKING_SYSTEM_PROMPT } = await import('./llm');
        const llmResponse = await invokeLLM({
          system: systemPrompt || BOOKING_SYSTEM_PROMPT,
          messages: input.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        });

        const content: string = llmResponse.choices?.[0]?.message?.content || 'I apologize, I could not process your request. Please try again.';

        // Check if the LLM included a booking confirmation signal
        // Extract JSON by finding the opening brace after BOOKING_CONFIRMED: and scanning for the matching closing brace
        console.log('[Booking Chat] Content from LLM:', content.substring(0, 300));
        const signalIndex = content.indexOf('BOOKING_CONFIRMED:');
        console.log('[Booking Chat] BOOKING_CONFIRMED signal found at index:', signalIndex);
        if (signalIndex !== -1) {
          try {
            const jsonStart = content.indexOf('{', signalIndex);
            if (jsonStart === -1) throw new Error('No JSON object found after BOOKING_CONFIRMED:');
            // Walk forward to find the matching closing brace
            let depth = 0;
            let jsonEnd = -1;
            for (let i = jsonStart; i < content.length; i++) {
              if (content[i] === '{') depth++;
              else if (content[i] === '}') {
                depth--;
                if (depth === 0) { jsonEnd = i; break; }
              }
            }
            if (jsonEnd === -1) throw new Error('Could not find closing brace for BOOKING_CONFIRMED JSON');
            const jsonStr = content.slice(jsonStart, jsonEnd + 1);
            console.log('[Booking Chat] Extracted JSON string:', jsonStr);
            const bookingData = JSON.parse(jsonStr);
            console.log('[Booking Chat] Parsed booking data:', bookingData);
            let bookingResult: Awaited<ReturnType<typeof createCalComBooking>>;
            try {
              bookingResult = await createCalComBooking({
                customerName: bookingData.customerName,
                customerEmail: bookingData.customerEmail,
                customerPhone: bookingData.customerPhone,
                startTime: bookingData.startTime,
                timeZone: tz,
              });
            } catch (calErr: any) {
              console.error('[Booking Chat] Cal.com threw an exception:', calErr.message);
              bookingResult = { success: false, error: calErr.message } as any;
            }
            console.log('[Booking Chat] Cal.com booking result:', bookingResult);

            if (!bookingResult.success) {
              // Cal.com call failed — do NOT show Claude's premature "confirmed" message.
              // Instead return an honest apology so the customer knows to try again.
              const errorDetail = (bookingResult as any).error || 'unknown error';
              console.error('[Booking Chat] Booking failed, returning honest error to customer. Detail:', errorDetail);
              return {
                reply: "I'm sorry, I wasn't able to complete your booking right now due to a technical issue. Please try again in a moment, or contact us directly at (705) 996-1010 or contact@a1marinecare.ca and we'll get you booked straight away.",
                booked: false,
                bookingDetails: null,
                bookingError: errorDetail,
              };
            }

            // Booking succeeded — strip the raw signal line and return the clean reply
            const cleanContent = content.slice(0, signalIndex).trim() + '\n' + content.slice(jsonEnd + 1).trim();

            // Resolve service names and location from the quote (used by both email and DB record)
            const serviceNames: string[] = [];
            let emailLocation = 'your marina';
            try {
              const q = input.quoteId ? await getQuoteById(input.quoteId) : null;
              if (q) {
                const svc = q.services as Record<string, any>;
                if (svc?.gelcoat) serviceNames.push('Gelcoat Restoration');
                if (svc?.exterior) serviceNames.push('Exterior Detailing');
                if (svc?.interior) serviceNames.push('Interior Detailing');
                if (svc?.ceramic) serviceNames.push('Ceramic Coating');
                if (svc?.graphene) serviceNames.push('Graphene Coating');
                if (svc?.wetSanding) serviceNames.push('Wet Sanding');
                if (svc?.bottomPainting) serviceNames.push('Bottom Painting');
                if (svc?.vinyl) serviceNames.push('Vinyl Wrap');
                if (q.location) emailLocation = q.location;
              }
            } catch {}

            const resolvedServices = serviceNames.length > 0 ? serviceNames.join(', ') : 'Boat detailing services';

            // Persist booking record for reminder scheduling (non-blocking)
            createBooking({
              quoteId: input.quoteId,
              calcomBookingId: String((bookingResult as any).bookingId || ''),
              calcomBookingUid: (bookingResult as any).bookingUid,
              customerName: bookingData.customerName,
              customerEmail: bookingData.customerEmail,
              customerPhone: bookingData.customerPhone,
              startTime: new Date((bookingResult as any).startTime),
              endTime: (bookingResult as any).endTime ? new Date((bookingResult as any).endTime) : undefined,
              services: resolvedServices,
              location: emailLocation,
              timeZone: tz,
            }).catch(e => console.error('[Booking] Failed to persist booking record:', e.message));

            // Fire confirmation email (non-blocking — don't let email failure break the booking response)
            sendBookingConfirmationEmail({
              customerName: bookingData.customerName,
              customerEmail: bookingData.customerEmail,
              startTime: (bookingResult as any).startTime,
              endTime: (bookingResult as any).endTime,
              bookingUid: (bookingResult as any).bookingUid,
              quoteId: input.quoteId,
              services: resolvedServices,
              location: emailLocation,
              timeZone: tz,
            }).catch(e => console.error('[Email] Non-blocking send error:', e.message));

            return {
              reply: cleanContent.trim(),
              booked: true,
              bookingDetails: {
                bookingId: (bookingResult as any).bookingId,
                bookingUid: (bookingResult as any).bookingUid,
                startTime: (bookingResult as any).startTime,
                endTime: (bookingResult as any).endTime,
              },
              bookingError: null,
            };
          } catch (parseErr) {
            console.error('[Booking Chat] Failed to parse booking data:', parseErr);
            // Strip the signal even if booking failed
            const cleanContent = content.slice(0, signalIndex).trim();
            return { reply: cleanContent || content, booked: false, bookingDetails: null, bookingError: 'Failed to parse booking data' };
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
