import { nanoid } from 'nanoid';
import { Quote, IQuote } from './models/Quote';
import { Booking, IBooking } from './models/Booking';
import { connectDB } from './db/mongodb';

// Ensure database connection
connectDB().catch((err) => {
  console.error('Failed to connect to MongoDB:', err);
});

export async function createQuote(data: {
  boatLength: number;
  boatType: string;
  location: string;
  fullName: string;
  email: string;
  phone: string;
  services: Record<string, any>;
  subtotal: number;
  tax: number;
  total: number;
  depositAmount: number;
}) {
  const quote = await Quote.create({
    id: nanoid(),
    ...data,
    depositPaid: false,
  });

  return quote.toObject();
}

export async function getQuoteById(id: string) {
  const quote = await Quote.findOne({ id });
  return quote ? quote.toObject() : null;
}

export async function getAllQuotes() {
  const quotes = await Quote.find().sort({ createdAt: -1 });
  return quotes.map(q => q.toObject());
}

export async function updateQuotePaymentStatus(
  id: string,
  data: {
    depositPaid: boolean;
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
  }
) {
  const quote = await Quote.findOneAndUpdate(
    { id },
    { $set: data },
    { new: true }
  );

  return quote ? quote.toObject() : null;
}

export async function getQuoteByStripeSessionId(sessionId: string) {
  const quote = await Quote.findOne({ stripeSessionId: sessionId });
  return quote ? quote.toObject() : null;
}

export async function getQuoteByPhone(phone: string) {
  // Find the most recent quote for this phone number
  const quote = await Quote.findOne({ phone }).sort({ createdAt: -1 });
  return quote ? quote.toObject() : null;
}

// ─── Booking helpers ──────────────────────────────────────────────────────────

export async function createBooking(data: {
  quoteId?: string;
  calcomBookingId?: string;
  calcomBookingUid?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: Date;
  endTime?: Date;
  services?: string;
  location?: string;
  timeZone?: string;
}) {
  const booking = await Booking.create({
    id: nanoid(),
    ...data,
    timeZone: data.timeZone || 'America/Toronto',
    reminderSent: false,
  });
  return booking.toObject();
}

/**
 * Return all bookings whose reminder has not yet been sent and whose
 * appointment starts between `windowStart` and `windowEnd` (UTC).
 */
export async function getBookingsDueForReminder(windowStart: Date, windowEnd: Date) {
  const bookings = await Booking.find({
    reminderSent: false,
    startTime: { $gte: windowStart, $lte: windowEnd },
  });
  return bookings.map(b => b.toObject());
}

export async function markReminderSent(bookingId: string) {
  await Booking.findOneAndUpdate(
    { id: bookingId },
    { $set: { reminderSent: true, reminderSentAt: new Date() } }
  );
}
