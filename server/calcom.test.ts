import { describe, it, expect } from "vitest";
import { testCalComConnection } from "./calcom";

describe("Cal.com Integration", () => {
  it("should successfully connect to Cal.com API with valid credentials", async () => {
    const result = await testCalComConnection();
    
    expect(result.success).toBe(true);
    expect(result.eventTypeFound).toBe(true);
    expect(result.eventTypeId).toBe(4825227);
  }, 10000); // 10 second timeout for API call
});
