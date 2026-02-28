import { Resend } from "resend";

// Lazily initialised so a missing key at server startup doesn't throw
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

/** Format an ISO date string into a human-readable date + time */
function formatDateTime(iso: string, timeZone = "America/Toronto") {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("en-CA", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-CA", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return { datePart, timePart };
}

export interface BookingConfirmationParams {
  customerName: string;
  customerEmail: string;
  startTime: string;
  endTime?: string;
  bookingUid?: string;
  quoteId?: string;
  services?: string;
  location?: string;
  timeZone?: string;
}

export async function sendBookingConfirmationEmail(params: BookingConfirmationParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY is not set — skipping confirmation email");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const tz = params.timeZone || "America/Toronto";
  const { datePart, timePart } = formatDateTime(params.startTime, tz);
  const endFormatted = params.endTime ? formatDateTime(params.endTime, tz).timePart : null;
  const timeRange = endFormatted ? `${timePart} – ${endFormatted}` : timePart;
  const rescheduleUrl = params.bookingUid
    ? `https://cal.com/reschedule/${params.bookingUid}`
    : "https://cal.com/a1-marine-care/book-your-service";
  const location = params.location || "Your marina";
  const services = params.services || "Boat detailing services";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmation – A1 Marine Care</title>
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #111111; border-radius: 16px; overflow: hidden; border: 1px solid #1f1f1f; }
    .header { background: #000000; padding: 32px 40px; text-align: center; border-bottom: 1px solid #1a1a1a; }
    .header img { height: 64px; width: auto; }
    .body { padding: 40px; }
    .check-icon { width: 56px; height: 56px; background: rgba(0,255,255,0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .title { font-size: 24px; font-weight: 700; color: #ffffff; text-align: center; margin: 0 0 8px; }
    .subtitle { font-size: 15px; color: #888888; text-align: center; margin: 0 0 32px; }
    .detail-box { background: #0d0d0d; border: 1px solid #222222; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .detail-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .detail-row:last-child { margin-bottom: 0; }
    .detail-icon { width: 20px; height: 20px; color: #00FFFF; flex-shrink: 0; margin-top: 1px; }
    .detail-label { font-size: 11px; font-weight: 600; color: #555555; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
    .detail-value { font-size: 15px; color: #e0e0e0; font-weight: 500; }
    .divider { height: 1px; background: #1a1a1a; margin: 24px 0; }
    .cta-row { text-align: center; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 14px 32px; background: #00FFFF; color: #000000; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px; }
    .reschedule-link { display: block; text-align: center; font-size: 13px; color: #00FFFF; text-decoration: none; margin-bottom: 32px; }
    .footer { padding: 24px 40px; border-top: 1px solid #1a1a1a; text-align: center; }
    .footer p { font-size: 13px; color: #555555; margin: 4px 0; }
    .footer a { color: #00FFFF; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663289180469/WGIEJYNWHRlJZpOd.png" alt="A1 Marine Care" />
      </div>

      <!-- Body -->
      <div class="body">
        <!-- Check icon -->
        <div style="text-align:center;margin-bottom:20px;">
          <div style="display:inline-block;width:56px;height:56px;background:rgba(0,255,255,0.12);border-radius:50%;line-height:56px;font-size:28px;">✓</div>
        </div>

        <h1 class="title">Appointment Confirmed!</h1>
        <p class="subtitle">Hi ${params.customerName}, your boat detailing service is booked.</p>

        <!-- Detail box -->
        <div class="detail-box">
          <div class="detail-row">
            <div>
              <div class="detail-label">Date</div>
              <div class="detail-value">${datePart}</div>
            </div>
          </div>
          <div class="detail-row">
            <div>
              <div class="detail-label">Time</div>
              <div class="detail-value">${timeRange}</div>
            </div>
          </div>
          <div class="detail-row">
            <div>
              <div class="detail-label">Location</div>
              <div class="detail-value">${location}</div>
            </div>
          </div>
          <div class="detail-row">
            <div>
              <div class="detail-label">Services</div>
              <div class="detail-value">${services}</div>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="cta-row">
          <a href="${rescheduleUrl}" class="btn">Add to Calendar / Reschedule</a>
        </div>

        <div class="divider"></div>

        <p style="font-size:14px;color:#888888;text-align:center;margin:0 0 8px;">
          Our team will be in touch before your appointment. If you have any questions, reach out anytime.
        </p>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p><strong style="color:#cccccc;">A1 Marine Care</strong></p>
        <p><a href="tel:+17059961010">(705) 996-1010</a> &nbsp;·&nbsp; <a href="mailto:contact@a1marinecare.ca">contact@a1marinecare.ca</a></p>
        <p><a href="https://a1marinecare.ca">a1marinecare.ca</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await getResend().emails.send({
      from: "A1 Marine Care <bookings@a1marinecare.ca>",
      to: [params.customerEmail],
      subject: `Booking Confirmed – ${datePart}`,
      html,
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("[Email] Confirmation sent to", params.customerEmail, "id:", result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (err: any) {
    console.error("[Email] Failed to send confirmation:", err.message);
    return { success: false, error: err.message };
  }
}

// ─── 24-hour reminder email ───────────────────────────────────────────────────

export interface ReminderEmailParams {
  customerName: string;
  customerEmail: string;
  startTime: string;
  endTime?: string;
  bookingUid?: string;
  services?: string;
  location?: string;
  timeZone?: string;
}

export async function sendReminderEmail(params: ReminderEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY is not set — skipping reminder email");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  const tz = params.timeZone || "America/Toronto";
  const { datePart, timePart } = formatDateTime(params.startTime, tz);
  const endFormatted = params.endTime ? formatDateTime(params.endTime, tz).timePart : null;
  const timeRange = endFormatted ? `${timePart} – ${endFormatted}` : timePart;
  const rescheduleUrl = params.bookingUid
    ? `https://cal.com/reschedule/${params.bookingUid}`
    : "https://cal.com/a1-marine-care/book-your-service";
  const location = params.location || "your marina";
  const services = params.services || "Boat detailing services";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Appointment Reminder – A1 Marine Care</title>
  <style>
    body { margin: 0; padding: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #111111; border-radius: 16px; overflow: hidden; border: 1px solid #1f1f1f; }
    .header { background: #000000; padding: 32px 40px; text-align: center; border-bottom: 1px solid #1a1a1a; }
    .header img { height: 64px; width: auto; }
    .body { padding: 40px; }
    .badge { display: inline-block; background: rgba(255,165,0,0.15); border: 1px solid rgba(255,165,0,0.3); color: #FFA500; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: 700; color: #ffffff; text-align: center; margin: 0 0 8px; }
    .subtitle { font-size: 15px; color: #888888; text-align: center; margin: 0 0 32px; }
    .detail-box { background: #0d0d0d; border: 1px solid #222222; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .detail-label { font-size: 11px; font-weight: 600; color: #555555; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
    .detail-value { font-size: 15px; color: #e0e0e0; font-weight: 500; margin-bottom: 16px; }
    .detail-value:last-child { margin-bottom: 0; }
    .divider { height: 1px; background: #1a1a1a; margin: 24px 0; }
    .cta-row { text-align: center; margin-bottom: 16px; }
    .btn { display: inline-block; padding: 14px 32px; background: #00FFFF; color: #000000; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px; }
    .reschedule-note { font-size: 13px; color: #666666; text-align: center; margin-bottom: 32px; }
    .reschedule-note a { color: #00FFFF; text-decoration: none; }
    .footer { padding: 24px 40px; border-top: 1px solid #1a1a1a; text-align: center; }
    .footer p { font-size: 13px; color: #555555; margin: 4px 0; }
    .footer a { color: #00FFFF; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663289180469/WGIEJYNWHRlJZpOd.png" alt="A1 Marine Care" />
      </div>
      <div class="body">
        <div style="text-align:center;">
          <div class="badge">⏰ Reminder — Tomorrow</div>
        </div>
        <h1 class="title">Your Appointment is Tomorrow</h1>
        <p class="subtitle">Hi ${params.customerName}, just a friendly reminder about your upcoming service.</p>

        <div class="detail-box">
          <div class="detail-label">Date</div>
          <div class="detail-value">${datePart}</div>
          <div class="detail-label">Time</div>
          <div class="detail-value">${timeRange}</div>
          <div class="detail-label">Location</div>
          <div class="detail-value">${location}</div>
          <div class="detail-label">Services</div>
          <div class="detail-value">${services}</div>
        </div>

        <div class="cta-row">
          <a href="https://a1marinecare.ca" class="btn">View Appointment Details</a>
        </div>
        <p class="reschedule-note">
          Need to reschedule? <a href="${rescheduleUrl}">Click here</a> or call us at <a href="tel:+17059961010">(705) 996-1010</a>.
        </p>

        <div class="divider"></div>
        <p style="font-size:14px;color:#888888;text-align:center;margin:0;">
          Please ensure your boat is accessible and ready at the scheduled time. We look forward to seeing you!
        </p>
      </div>
      <div class="footer">
        <p><strong style="color:#cccccc;">A1 Marine Care</strong></p>
        <p><a href="tel:+17059961010">(705) 996-1010</a> &nbsp;·&nbsp; <a href="mailto:contact@a1marinecare.ca">contact@a1marinecare.ca</a></p>
        <p><a href="https://a1marinecare.ca">a1marinecare.ca</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    const result = await getResend().emails.send({
      from: "A1 Marine Care <bookings@a1marinecare.ca>",
      to: [params.customerEmail],
      subject: `Reminder: Your Boat Service is Tomorrow – ${datePart}`,
      html,
    });

    if (result.error) {
      console.error("[Email] Resend reminder error:", result.error);
      return { success: false, error: result.error.message };
    }

    console.log("[Email] Reminder sent to", params.customerEmail, "id:", result.data?.id);
    return { success: true, id: result.data?.id };
  } catch (err: any) {
    console.error("[Email] Failed to send reminder:", err.message);
    return { success: false, error: err.message };
  }
}
