import axios from "axios";

const CALCOM_API_URL = "https://api.cal.com/v2";
const CALCOM_API_KEY = process.env.CALCOM_API_KEY;
const CALCOM_EVENT_TYPE_ID = parseInt(process.env.CALCOM_EVENT_TYPE_ID || "0");

interface CreateBookingParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: string; // ISO 8601 format in UTC
  timeZone?: string;
}

export async function createCalComBooking(params: CreateBookingParams) {
  if (!CALCOM_API_KEY) {
    throw new Error("CALCOM_API_KEY is not set");
  }

  if (!CALCOM_EVENT_TYPE_ID) {
    throw new Error("CALCOM_EVENT_TYPE_ID is not set");
  }

  try {
    const response = await axios.post(
      `${CALCOM_API_URL}/bookings`,
      {
        start: params.startTime,
        eventTypeId: CALCOM_EVENT_TYPE_ID,
        attendee: {
          name: params.customerName,
          email: params.customerEmail,
          phoneNumber: params.customerPhone,
          timeZone: params.timeZone || "America/Toronto",
          language: "en",
        },
        metadata: {
          source: "marina-ai-call",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${CALCOM_API_KEY}`,
          "Content-Type": "application/json",
          "cal-api-version": "2024-08-13",
        },
      }
    );

    return {
      success: true,
      bookingId: response.data.data.id,
      bookingUid: response.data.data.uid,
      startTime: response.data.data.start,
      endTime: response.data.data.end,
      meetingUrl: response.data.data.meetingUrl,
    };
  } catch (error: any) {
    console.error("[Cal.com] Booking creation failed:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

/**
 * Test function to verify Cal.com API credentials
 */
export async function testCalComConnection() {
  if (!CALCOM_API_KEY) {
    throw new Error("CALCOM_API_KEY is not set");
  }

  try {
    const response = await axios.get(`${CALCOM_API_URL}/event-types`, {
      headers: {
        Authorization: `Bearer ${CALCOM_API_KEY}`,
        "cal-api-version": "2024-06-14",
      },
      params: {
        username: "a1-marine-care",
      },
    });

    const eventTypes = response.data.data;
    const bookYourServiceEvent = eventTypes.find((et: any) => et.slug === "book-your-service");

    return {
      success: true,
      eventTypeFound: !!bookYourServiceEvent,
      eventTypeId: bookYourServiceEvent?.id,
    };
  } catch (error: any) {
    console.error("[Cal.com] Connection test failed:", error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}
