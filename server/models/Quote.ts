import mongoose, { Schema, Document } from 'mongoose';

export interface IQuote extends Document {
  id: string;
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
  depositPaid: boolean;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuoteSchema = new Schema<IQuote>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    boatLength: {
      type: Number,
      required: true,
    },
    boatType: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    services: {
      type: Schema.Types.Mixed,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    depositAmount: {
      type: Number,
      required: true,
    },
    depositPaid: {
      type: Boolean,
      default: false,
    },
    stripeSessionId: {
      type: String,
      required: false,
    },
    stripePaymentIntentId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Quote = mongoose.model<IQuote>('Quote', QuoteSchema);
