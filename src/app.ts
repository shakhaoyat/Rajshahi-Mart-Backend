import "dotenv/config";
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import paymentsRouter from "./routes/payments.js";
import adminRouter from "./routes/admin.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
}));

app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminRouter);

app.get("/api/health", (_req, res) => {
      res.json({ ok: true });
});

app.use(errorHandler);

export default app;