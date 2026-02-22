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
          estimatedTotal: z.number().nonnegative(), // in cents
          requiresManualReview: z.boolean(),
          reviewReasons: z.array(z.string()).optional(),
          servicesConfig: z.any(), // JSON object of service configurations
        })
      )
      .mutation(async ({ input }) => {
        const result = await createQuote({
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          boatLength: input.boatLength,
          boatType: input.boatType,
          serviceLocation: input.serviceLocation,
          estimatedTotal: input.estimatedTotal,
          depositAmount: 25000, // $250 in cents
          requiresManualReview: input.requiresManualReview ? 1 : 0,
          reviewReasons: input.reviewReasons ? JSON.stringify(input.reviewReasons) : null,
          servicesConfig: JSON.stringify(input.servicesConfig),
        });

        return {
          success: true,
          quoteId: result[0].insertId,
        };
      }),

    // Get quote by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const quote = await getQuoteById(input.id);
        if (!quote) {
          throw new Error("Quote not found");
        }
        return quote;
      }),

    // Get all quotes (for admin dashboard - not used in quote form)
    list: publicProcedure.query(async () => {
      return await getAllQuotes();
    }),
  }),
});

export type AppRouter = typeof appRouter;
