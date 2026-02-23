import { nanoid } from 'nanoid';
import { Quote, IQuote } from './models/Quote';
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
