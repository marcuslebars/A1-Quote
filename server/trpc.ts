/**
 * tRPC Setup
 * No Manus dependencies
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { TrpcContext } from "./context";
import superjson from "superjson";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
