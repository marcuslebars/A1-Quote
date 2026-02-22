/**
 * tRPC Routers
 * No Manus dependencies
 */

import { z } from "zod";
import { router, publicProcedure } from "./trpc";
import { createQuote, getQuoteById } from "./db";

export const appRouter = router({
  quotes: router({
    // Public: Submit a new quote
    submit: publicProcedure
      .input(
        z.object({
          customerName: z.string(),
          customerEmail: z.string().email(),
          customerPhone: z.string(),
          boatLength: z.number(),
          boatType: z.string(),
          serviceLocation: z.string(),
          estimatedTotal: z.number(),
          depositAmount: z.number(),
          requiresManualReview: z.boolean(),
          reviewReasons: z.array(z.string()),
          serviceSelections: z.any(),
        })
      )
      .mutation(async ({ input }) => {
        const quoteId = await createQuote({
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          boatLength: input.boatLength,
          boatType: input.boatType,
          serviceLocation: input.serviceLocation,
          estimatedTotal: input.estimatedTotal,
          depositAmount: input.depositAmount,
          paymentStatus: "pending",
          requiresManualReview: input.requiresManualReview,
          reviewReasons: JSON.stringify(input.reviewReasons),
          serviceSelections: JSON.stringify(input.serviceSelections),
        });

        return { success: true, quoteId };
      }),

    // Public: Get quote by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getQuoteById(input.id);
      }),


  }),
});

export type AppRouter = typeof appRouter;
