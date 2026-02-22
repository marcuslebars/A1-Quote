import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { createQuote, getQuoteById } from "./db";

describe("Quote Submission API", () => {
  it("should submit a valid quote", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: undefined,
    });

    const result = await caller.quotes.submit({
      customerName: "John Smith",
      customerEmail: "john@example.com",
      customerPhone: "(555) 123-4567",
      boatLength: 35,
      boatType: "cruiser",
      serviceLocation: "Marina Bay",
      estimatedTotal: 450000, // $4,500 in cents
      requiresManualReview: false,
      servicesConfig: {
        selectedServices: {
          gelcoat: true,
          exterior: true,
        },
        gelcoat: {
          area: "hull",
          radarArch: false,
          hardTop: false,
          spotWetSanding: 0,
          heavyOxidation: false,
        },
        exterior: {
          tier: "standard",
          teakCleaning: true,
          canvasCleaning: false,
          fenderCleaning: false,
          exteriorOzone: false,
        },
      },
    });

    expect(result.success).toBe(true);
    expect(result.quoteId).toBeGreaterThan(0);
  });

  it("should submit a quote requiring manual review", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: undefined,
    });

    const result = await caller.quotes.submit({
      customerName: "Jane Doe",
      customerEmail: "jane@example.com",
      customerPhone: "(555) 987-6543",
      boatLength: 55,
      boatType: "yacht",
      serviceLocation: "Harbor Point",
      estimatedTotal: 0, // Manual review, no estimate yet
      requiresManualReview: true,
      reviewReasons: ["Boat length exceeds 45 feet", "Yacht with Deep Clean tier"],
      servicesConfig: {
        selectedServices: {
          interior: true,
        },
        interior: {
          tier: "deep",
          moldRemediation: true,
          mattressShampoo: false,
          headDeepClean: true,
          galleyDeepClean: true,
          petHairRemoval: false,
          ozoneInterior: true,
          photos: [],
          photoConfirmation: false,
        },
      },
    });

    expect(result.success).toBe(true);
    expect(result.quoteId).toBeGreaterThan(0);
  });

  it("should retrieve quote by ID", async () => {
    // First create a quote
    const createResult = await createQuote({
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      customerPhone: "(555) 000-0000",
      boatLength: 30,
      boatType: "bowrider",
      serviceLocation: "Test Marina",
      estimatedTotal: 250000,
      depositAmount: 25000,
      requiresManualReview: 0,
      servicesConfig: JSON.stringify({ test: true }),
    });

    const quoteId = createResult[0].insertId;

    // Then retrieve it
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: undefined,
    });

    const quote = await caller.quotes.getById({ id: quoteId });

    expect(quote).toBeDefined();
    expect(quote.customerName).toBe("Test Customer");
    expect(quote.boatLength).toBe(30);
    expect(quote.estimatedTotal).toBe(250000);
  });

  it("should validate required fields", async () => {
    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: undefined,
    });

    // Missing required fields should throw validation error
    await expect(
      caller.quotes.submit({
        customerName: "",
        customerEmail: "invalid-email",
        customerPhone: "",
        boatLength: -5, // Invalid negative length
        boatType: "",
        serviceLocation: "",
        estimatedTotal: -100,
        requiresManualReview: false,
        servicesConfig: {},
      })
    ).rejects.toThrow();
  });

  it("should store service configurations as JSON", async () => {
    const servicesConfig = {
      selectedServices: {
        ceramic: true,
        graphene: true,
      },
      ceramic: {
        secondLayer: true,
        teakCeramic: false,
        interiorCeramic: true,
      },
      graphene: {
        secondLayer: false,
        teakGraphene: true,
      },
    };

    const caller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: undefined,
    });

    const result = await caller.quotes.submit({
      customerName: "Config Test",
      customerEmail: "config@example.com",
      customerPhone: "(555) 111-2222",
      boatLength: 40,
      boatType: "cruiser",
      serviceLocation: "Test Location",
      estimatedTotal: 600000,
      requiresManualReview: false,
      servicesConfig,
    });

    // Retrieve and verify JSON storage
    const quote = await caller.quotes.getById({ id: result.quoteId });
    const storedConfig = JSON.parse(quote.servicesConfig);

    expect(storedConfig.ceramic.secondLayer).toBe(true);
    expect(storedConfig.graphene.teakGraphene).toBe(true);
  });
});
