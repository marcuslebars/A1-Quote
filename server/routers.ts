import { z } from "zod";
import { createQuote, getAllQuotes, getQuoteById, getQuoteByPhone, getQuoteByStripeSessionId } from "./db";
import { publicProcedure, router } from "./trpc";
import { triggerMarinaCall } from "./elevenlabs";

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
      .input(z.object({ phoneNumber: z.string().min(10) }))
      .mutation(async ({ input }) => {
        // Trigger ElevenLabs call with provided phone number
        const result = await triggerMarinaCall(input.phoneNumber);

        if (!result.success) {
          throw new Error(result.error || 'Failed to trigger Marina call');
        }

        return {
          success: true,
          conversationId: result.conversationId,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
