import { Router, type Request, type Response } from "express";
import Order from "../models/Order.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

// Buyer: my orders
router.get("/mine", requireAuth, requireRole("buyer", "admin"), async (req: Request, res: Response) => {
  const orders = await Order.find({ buyerId: req.user!.id }).sort({ createdAt: -1 });
  res.json(orders);
});

// Seller: orders containing my products
router.get("/sales", requireAuth, requireRole("seller", "admin"), async (req: Request, res: Response) => {
  const orders = await Order.find({ "items.sellerId": req.user!.id, status: "paid" }).sort({
    createdAt: -1,
  });
  res.json(orders);
});

export default router;
