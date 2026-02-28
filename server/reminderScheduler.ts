/**
 * Reminder Scheduler
 *
 * Runs every hour and sends a "24-hour reminder" email to any customer whose
 * appointment falls within the next 23–25 hour window (UTC). The 2-hour window
 * ensures we don't miss anyone due to the hourly poll interval.
 *
 * Each booking record has a `reminderSent` flag that is set to true after the
 * email is dispatched, so reminders are never sent twice.
 */

import { getBookingsDueForReminder, markReminderSent } from "./db";
import { sendReminderEmail } from "./email";

const POLL_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const REMINDER_WINDOW_HOURS_MIN = 23;
const REMINDER_WINDOW_HOURS_MAX = 25;

async function runReminderJob() {
  const now = new Date();
  const windowStart = new Date(now.getTime() + REMINDER_WINDOW_HOURS_MIN * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS_MAX * 60 * 60 * 1000);

  console.log(
    `[Reminder] Checking for appointments between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`
  );

  let bookings: any[] = [];
  try {
    bookings = await getBookingsDueForReminder(windowStart, windowEnd);
  } catch (err: any) {
    console.error("[Reminder] Failed to query bookings:", err.message);
    return;
  }

  if (bookings.length === 0) {
    console.log("[Reminder] No reminders due.");
    return;
  }

  console.log(`[Reminder] Sending ${bookings.length} reminder(s)...`);

  for (const booking of bookings) {
    try {
      const result = await sendReminderEmail({
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        startTime: booking.startTime instanceof Date
          ? booking.startTime.toISOString()
          : String(booking.startTime),
        endTime: booking.endTime
          ? (booking.endTime instanceof Date ? booking.endTime.toISOString() : String(booking.endTime))
          : undefined,
        bookingUid: booking.calcomBookingUid,
        services: booking.services,
        location: booking.location,
        timeZone: booking.timeZone || "America/Toronto",
      });

      if (result.success) {
        await markReminderSent(booking.id);
        console.log(`[Reminder] Sent to ${booking.customerEmail} (booking ${booking.id})`);
      } else {
        console.error(`[Reminder] Failed for ${booking.customerEmail}:`, result.error);
      }
    } catch (err: any) {
      console.error(`[Reminder] Error processing booking ${booking.id}:`, err.message);
    }
  }
}

let _schedulerStarted = false;

export function startReminderScheduler() {
  if (_schedulerStarted) return;
  _schedulerStarted = true;

  console.log("[Reminder] Scheduler started — polling every hour.");

  // Run once immediately on startup (catches any missed reminders after a restart)
  runReminderJob().catch(e => console.error("[Reminder] Initial run error:", e.message));

  // Then run every hour
  setInterval(() => {
    runReminderJob().catch(e => console.error("[Reminder] Scheduled run error:", e.message));
  }, POLL_INTERVAL_MS);
}
