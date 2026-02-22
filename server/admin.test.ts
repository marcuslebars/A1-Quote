import { describe, it, expect, beforeAll } from 'vitest';
import { getDb } from './db';
import { quotes } from '../drizzle/schema';
import { eq, like } from 'drizzle-orm';

describe('Admin Quote Management', () => {
  let testQuoteId: number;

  beforeAll(async () => {
    // Create a test quote for admin operations
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    await db.insert(quotes).values({
      customerName: 'Admin Test User',
      customerEmail: 'admin@test.com',
      customerPhone: '(555) 999-0000',
      boatLength: 40,
      boatType: 'yacht',
      serviceLocation: 'Admin Test Marina',
      estimatedTotal: 500000, // $5000 in cents
      depositAmount: 25000, // $250 in cents
      paymentStatus: 'pending',
      requiresManualReview: 0, // boolean as int
      reviewReasons: null,
      servicesConfig: JSON.stringify({
        gelcoat: { area: 'hull', radarArch: false, hardTop: false, spotWetSanding: 0, heavyOxidation: false }
      })
    });
    
    // Get the inserted quote ID
    const inserted = await db.select().from(quotes).where(eq(quotes.customerEmail, 'admin@test.com')).limit(1);
    testQuoteId = inserted[0].id;
  });

  it('should list all quotes', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const allQuotes = await db.select().from(quotes);
    expect(allQuotes.length).toBeGreaterThan(0);
    expect(allQuotes[0]).toHaveProperty('id');
    expect(allQuotes[0]).toHaveProperty('customerName');
    expect(allQuotes[0]).toHaveProperty('paymentStatus');
  });

  it('should filter quotes by payment status', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const pendingQuotes = await db.select().from(quotes).where(eq(quotes.paymentStatus, 'pending'));
    expect(pendingQuotes.every(q => q.paymentStatus === 'pending')).toBe(true);
  });

  it('should update payment status to paid', async () => {
    const { updateQuotePaymentStatus } = await import('./db');
    await updateQuotePaymentStatus(testQuoteId, 'test_payment_intent_123', 'paid');
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const updatedQuote = await db.select().from(quotes).where(eq(quotes.id, testQuoteId)).limit(1);
    expect(updatedQuote[0].paymentStatus).toBe('paid');
    expect(updatedQuote[0].stripePaymentIntentId).toBe('test_payment_intent_123');
  });

  it('should update payment status to refunded', async () => {
    const { updateQuotePaymentStatus } = await import('./db');
    await updateQuotePaymentStatus(testQuoteId, '', 'refunded'); // Empty string for no payment intent
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const updatedQuote = await db.select().from(quotes).where(eq(quotes.id, testQuoteId)).limit(1);
    expect(updatedQuote[0].paymentStatus).toBe('refunded');
  });

  it('should search quotes by customer name', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const searchResults = await db.select().from(quotes).where(like(quotes.customerName, '%Admin Test%'));
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].customerName).toContain('Admin Test');
  });

  it('should search quotes by email', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const searchResults = await db.select().from(quotes).where(like(quotes.customerEmail, '%admin@test.com%'));
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0].customerEmail).toBe('admin@test.com');
  });

  it('should count quotes by status', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const allQuotes = await db.select().from(quotes);
    const statusCounts = {
      pending: allQuotes.filter(q => q.paymentStatus === 'pending').length,
      paid: allQuotes.filter(q => q.paymentStatus === 'paid').length,
      refunded: allQuotes.filter(q => q.paymentStatus === 'refunded').length
    };
    
    expect(statusCounts.pending + statusCounts.paid + statusCounts.refunded).toBe(allQuotes.length);
  });

  it('should identify quotes requiring manual review', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const reviewQuotes = await db.select().from(quotes).where(eq(quotes.requiresManualReview, true));
    reviewQuotes.forEach(quote => {
      expect(quote.requiresManualReview).toBe(1); // boolean stored as int
      expect(quote.reviewReasons).toBeTruthy();
    });
  });
});
