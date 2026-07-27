import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./src/lib/auth.js";
import { connectDB } from "./src/config/db.js";
import "./src/types/auth.js"; // Express.Request augmentation

import productsRouter from "./src/routes/products.js";
import ordersRouter from "./src/routes/orders.js";
import paymentsRouter from "./src/routes/payments.js";
import adminRouter from "./src/routes/admin.js";
import purchasesRouter from "./src/routes/purchases.js";
import userRouter from "./src/routes/user.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Better Auth handles its own routes (signup/login/session/etc) at /api/auth/*
// It needs the RAW request, so it's mounted before express.json().
app.all("/api/auth/*", toNodeHandler(auth));

// Skip global JSON parsing for the Stripe webhook route — it needs the raw
// body to verify the signature (handled inside payments.ts with express.raw()).
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === "/api/payments/webhook") return next();
  express.json()(req, res, next);
});

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/purchases", purchasesRouter);
app.use("/api/user", userRouter);

app.get("/api/health", (_req: Request, res: Response) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});