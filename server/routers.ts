import { z } from "zod";
import { createQuote, getAllQuotes, getQuoteById, getQuoteByPhone, getQuoteByStripeSessionId } from "./db";
import { publicProcedure, router } from "./trpc";
import { triggerMarinaCall } from "./elevenlabs";
import { createCalComBooking } from "./calcom";

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
