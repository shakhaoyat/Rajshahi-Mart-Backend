import { Request, Response } from "express";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

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
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
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
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      Product.find(filter).sort(sortOptions).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.json({
      data,
      total,
      page: parseInt(page, 10),
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
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// Seller: list own products
router.get("/seller/mine", requireAuth, requireRole("seller", "admin"), async (req: Request, res: Response) => {
  const products = await Product.find({ sellerId: req.user!.id }).sort({ createdAt: -1 });
  res.json(products);
});

// Seller: create product
router.post("/", requireAuth, requireRole("seller", "admin"), validateProduct(createProductSchema), async (req: Request, res: Response) => {
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
});

// Seller: update own product (admin can edit any)
router.put("/:id", requireAuth, requireRole("seller", "admin"), validateProduct(createProductSchema), async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.sellerId !== req.user!.id && req.user!.role !== "admin") {
    return res.status(403).json({ error: "Not your product" });
  }
  Object.assign(product, req.body);
  await product.save();
  res.json(product);
});

// Seller: delete own product (admin can delete any)
router.delete("/:id", requireAuth, requireRole("seller", "admin"), async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.sellerId !== req.user!.id && req.user!.role !== "admin") {
    return res.status(403).json({ error: "Not your product" });
  }
  await product.deleteOne();
  res.json({ success: true });
});

// Seller: toggle product active status
router.patch("/:id/toggle", requireAuth, requireRole("seller", "admin"), async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.sellerId !== req.user!.id && req.user!.role !== "admin") {
    return res.status(403).json({ error: "Not your product" });
  }
  product.isActive = !product.isActive;
  await product.save();
  res.json(product);
});