import { describe, it, expect } from "vitest";

describe("Resend API key validation", () => {
  it("RESEND_API_KEY is set and accepted by the Resend API", async () => {
    const key = process.env.RESEND_API_KEY;
    expect(key, "RESEND_API_KEY must be set").toBeTruthy();

    // Call the Resend /domains endpoint — a lightweight read-only check
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });

    // 200 = valid key, 401 = invalid key
    expect(res.status, `Resend API returned ${res.status} — check your API key`).toBe(200);
  });
});
