import express from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./context";
import { handleStripeWebhook } from "./stripe";
import { connectDB } from "./db/mongodb";
import path from "path";
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
    console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
  });
} catch (error) {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
}
