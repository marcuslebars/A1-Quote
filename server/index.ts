import express from "express";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./context";
import { handleStripeWebhook } from "./stripe";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

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

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const clientPath = path.join(__dirname, "../client");
  app.use(express.static(clientPath));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 tRPC API: http://localhost:${PORT}/api/trpc`);
  console.log(`💳 Stripe webhook: http://localhost:${PORT}/api/webhooks/stripe`);
});
