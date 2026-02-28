import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
  id: string;
  quoteId?: string;
  calcomBookingId?: string;
  calcomBookingUid?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: Date;       // UTC appointment start
  endTime?: Date;        // UTC appointment end
  services?: string;
  location?: string;
  timeZone: string;
  reminderSent: boolean;
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    id: { type: String, required: true, unique: true },
    quoteId: { type: String },
    calcomBookingId: { type: String },
    calcomBookingUid: { type: String },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    customerPhone: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    services: { type: String },
    location: { type: String },
    timeZone: { type: String, default: 'America/Toronto' },
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },
  },
  { timestamps: true }
);

// Index for efficient reminder queries: find unsent reminders where startTime is approaching
BookingSchema.index({ reminderSent: 1, startTime: 1 });

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
