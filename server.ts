import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { connectDB } from "./src/config/db.js";
import { auth } from "./src/lib/auth.js";
import productsRouter from "./src/routes/products.js";
import ordersRouter from "./src/routes/orders.js";
import paymentsRouter from "./src/routes/payments.js";
import adminRouter from "./src/routes/admin.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { requireAuth } from "./src/middleware/requireAuth.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// Better Auth handles its own routes.
// IMPORTANT: this must be mounted BEFORE express.json(), because
// better-auth parses the request body itself. If express.json() runs
// first, the body stream is already consumed and better-auth's handler
// will fail (or silently receive an empty body).
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

// API routes
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });