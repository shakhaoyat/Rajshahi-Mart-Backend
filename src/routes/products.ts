import express, { Request, Response } from "express";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validateProduct } from "../middleware/validate.js";

const router = express.Router();
const PAGE_SIZE = 12;

router.get("/", async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      page = "1",
      limit = "12",
    } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = { isActive: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      const priceFilter: { $gte?: number; $lte?: number } = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      filter.price = priceFilter;
    }

    const sortOptions: Record<string, 1 | -1> = {};
    switch (sort) {
      case "price-asc":
        sortOptions.price = 1;
        break;
      case "price-desc":
        sortOptions.price = -1;
        break;
      case "name-asc":
        sortOptions.title = 1;
        break;
      default:
        sortOptions.createdAt = -1;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || PAGE_SIZE));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Product.find(filter).sort(sortOptions).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("Products list error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Public: single product
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Product fetch error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Seller: list own products
router.get("/seller/mine", requireAuth, requireRole("seller", "admin"), async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ sellerId: req.user!.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("Seller products error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Seller: create product
router.post(
  "/",
  requireAuth,
  requireRole("seller", "admin"),
  validateProduct,
  async (req: Request, res: Response) => {
    try {
      const { title, description, price, image, stock, category } = req.body;
      if (!title || price == null) {
        return res.status(400).json({ error: "title and price are required" });
      }
      const product = await Product.create({
        title,
        description,
        price,
        image,
        stock: stock ?? 0,
        category: category ?? "other",
        sellerId: req.user!.id,
        sellerName: req.user!.name || req.user!.email,
      });
      res.status(201).json(product);
    } catch (err) {
      console.error("Product create error:", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);

// Seller: update own product (admin can edit any)
router.put(
  "/:id",
  requireAuth,
  requireRole("seller", "admin"),
  validateProduct,
  async (req: Request, res: Response) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      if (product.sellerId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ error: "Not your product" });
      }
      Object.assign(product, req.body);
      await product.save();
      res.json(product);
    } catch (err) {
      console.error("Product update error:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// Seller: delete own product (admin can delete any)
router.delete("/:id", requireAuth, requireRole("seller", "admin"), async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.sellerId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Not your product" });
    }
    await product.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("Product delete error:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Seller: toggle product active status
router.patch("/:id/toggle", requireAuth, requireRole("seller", "admin"), async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.sellerId !== req.user!.id && req.user!.role !== "admin") {
      return res.status(403).json({ error: "Not your product" });
    }
    product.isActive = !product.isActive;
    await product.save();
    res.json(product);
  } catch (err) {
    console.error("Product toggle error:", err);
    res.status(500).json({ error: "Failed to toggle product" });
  }
});

export default router;