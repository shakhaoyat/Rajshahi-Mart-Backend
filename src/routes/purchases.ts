import { Router, type Request, type Response } from "express";
import Purchase from "../models/Purchase.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

// User: create a purchase (Buy Now)
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      productId,
      productTitle,
      productImage,
      price,
    } = req.body;

    // Validate required fields
    if (!productId || !productTitle || !productImage || price == null) {
      return res.status(400).json({ error: "Missing required product fields" });
    }

    // Get authenticated user from Better Auth
    const userId = req.user?.id;
    const userName = req.user?.name ?? "";
    const userEmail = req.user?.email ?? "";

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const purchase = await Purchase.create({
      userId,
      userName,
      userEmail,
      productId,
      productTitle,
      productImage,
      price,
      purchasedAt: new Date(),
      status: "pending",
    });

    res.status(201).json(purchase);
  } catch (err) {
    console.error("Purchase creation error:", err);
    res.status(500).json({ error: "Failed to create purchase" });
  }
});

// User: get their own purchases
router.get("/mine", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const purchases = await Purchase.find({ userId }).sort({ purchasedAt: -1 });
    res.json(purchases);
  } catch (err) {
    console.error("Fetch user purchases error:", err);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

// Admin: get all purchases
router.get("/", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const purchases = await Purchase.find().sort({ purchasedAt: -1 });
    res.json(purchases);
  } catch (err) {
    console.error("Fetch all purchases error:", err);
    res.status(500).json({ error: "Failed to fetch purchases" });
  }
});

// Admin: update purchase status
router.patch("/:id/status", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const allowedStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    purchase.status = status;
    await purchase.save();

    res.json(purchase);
  } catch (err) {
    console.error("Update purchase status error:", err);
    res.status(500).json({ error: "Failed to update purchase status" });
  }
});

export default router;