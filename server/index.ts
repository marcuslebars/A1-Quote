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

// Connect to MongoDB
try {
  await connectDB();
} catch (error) {
  console.error("Failed to connect to MongoDB:", error);
}

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

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
app.use(cookieParser());
app.use(express.json());

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

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
  const clientPath = path.join(__dirname, "public");
  app.use(express.static(clientPath));
  
  // Catch-all route for SPA - only for non-API routes
  app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📊 tRPC API: http://${HOST}:${PORT}/api/trpc`);
  console.log(`💳 Stripe webhook: http://${HOST}:${PORT}/api/webhooks/stripe`);
});
