import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { auth } from "./src/lib/auth.js";
import productsRouter from "./src/routes/products.js";
import ordersRouter from "./src/routes/orders.js";
import paymentsRouter from "./src/routes/payments.js";
import adminRouter from "./src/routes/admin.js";
import { connectDB } from "./config/db";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth } from "../middleware/requireAuth.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
});

app.use(express.json());

// Better Auth handles its own routes
app.all("/api/auth/*", (req, res, next) => {
  next();
});

// Standard middleware
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

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB:", err.message);
  process.exit(1);
}