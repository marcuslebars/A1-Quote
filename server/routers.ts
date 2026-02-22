import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { createQuote, getAllQuotes, getQuoteById, updateQuotePaymentStatus } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

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

    // Get all quotes (for admin)
    list: adminProcedure.query(async () => {
      return await getAllQuotes();
    }),

    // Update payment status (admin only)
    updatePaymentStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "paid", "refunded"]),
        })
      )
      .mutation(async ({ input }) => {
        // Use "manual" as payment intent ID for admin updates
        await updateQuotePaymentStatus(input.id, "manual-update", input.status);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
