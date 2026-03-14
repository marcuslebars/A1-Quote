import express from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./context";
import { handleStripeWebhook } from "./stripe";
import marinaRouter from "./marina";
import { connectDB } from './db/mongodb';
import { startReminderScheduler } from './reminderScheduler';
import { generateQuotePDF } from './pdf';
import path from 'path';
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[Server] Initializing...');
console.log('[Server] NODE_ENV:', process.env.NODE_ENV);
console.log('[Server] PORT:', process.env.PORT);

// Connect to MongoDB
try {
  console.log('[Server] Connecting to MongoDB...');
  await connectDB();
  console.log('[Server] MongoDB connection complete');
  // Start the 24-hour reminder scheduler after DB is ready
  startReminderScheduler();
} catch (error) {
  console.error("[Server] Failed to connect to MongoDB:", error);
}

console.log('[Server] Creating Express app...');
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
console.log('[Server] Express app created, PORT:', PORT);

// Health check endpoint for Railway
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Stripe webhook (must be before body parser)
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Middleware
console.log('[Server] Setting up middleware...');
app.use(cookieParser());
app.use(express.json());
console.log('[Server] Middleware configured');

// tRPC API
console.log('[Server] Setting up tRPC...');
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);
console.log('[Server] tRPC configured');

// Marina AI webhook
app.use("/api/marina", marinaRouter);
console.log('[Server] Marina webhook configured');

// PDF Quote Download endpoint
app.post("/api/quote/download-pdf", express.json(), (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, boatLength, boatType, serviceLocation, services, estimatedTotal, breakdown } = req.body;
    
    if (!customerName || !boatLength || !boatType || !services || estimatedTotal === undefined || !breakdown) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const pdf = generateQuotePDF({
      customerName,
      customerEmail,
      customerPhone,
      boatLength,
      boatType,
      serviceLocation,
      services,
      estimatedTotal,
      breakdown,
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="A1-Quote-${customerName.replace(/\s+/g, '-')}-${Date.now()}.pdf"`);

    // Pipe PDF to response
    pdf.pipe(res);
  } catch (error: any) {
    console.error('[PDF] Error generating quote PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});
console.log('[Server] PDF download endpoint configured');

// Development: Vite dev server (dynamic import to avoid loading vite in production)
if (process.env.NODE_ENV === "development") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

// Production: Serve static files
if (process.env.NODE_ENV === "production") {
  console.log('[Server] Setting up static file serving...');
  const clientPath = path.join(__dirname, "public");
  console.log('[Server] Client path:', clientPath);
  app.use(express.static(clientPath));
  
  // Catch-all route for SPA - only for non-API routes
  app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
  console.log('[Server] Static file serving configured');
}

const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

console.log(`[Server] Starting server on ${HOST}:${PORT}...`);
console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[Server] __dirname: ${__dirname}`);

try {
  app.listen(PORT, HOST, () => {
    console.log(`✅ Server running on http://${HOST}:${PORT}`);
    console.log(`📊 tRPC API: http://${HOST}:${PORT}/api/trpc`);
    console.log(`💳 Stripe webhook: http://${HOST}:${PORT}/api/webhooks/stripe`);
    console.log(`🤖 Marina webhook: http://${HOST}:${PORT}/api/marina/context`);
    console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
  });
} catch (error) {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
}
