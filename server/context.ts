import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Context } from "./trpc";

export function createContext({
  req,
  res,
}: CreateExpressContextOptions): Context {
  return { req, res };
}
