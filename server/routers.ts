import { z } from "zod";
import { createQuote, getAllQuotes, getQuoteById } from "./db";
import { publicProcedure, router } from "./trpc";

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
  }),
});

export type AppRouter = typeof appRouter;
