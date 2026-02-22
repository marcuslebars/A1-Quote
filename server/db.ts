/**
 * Database helpers
 * No Manus dependencies - direct Drizzle ORM usage
 */

import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { quotes, users, InsertQuote } from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Quote operations
export async function createQuote(quote: InsertQuote) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [result] = await db.insert(quotes).values(quote).$returningId();
  return result.id;
}

export async function getQuoteById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [quote] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return quote || null;
}

export async function getAllQuotes() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(quotes).orderBy(quotes.createdAt);
}

export async function updateQuotePaymentStatus(
  id: number,
  status: "pending" | "paid" | "refunded",
  paymentIntentId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(quotes)
    .set({
      paymentStatus: status,
      stripePaymentIntentId: paymentIntentId || null,
      updatedAt: new Date(),
    })
    .where(eq(quotes.id, id));
}

// User operations
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user || null;
}
