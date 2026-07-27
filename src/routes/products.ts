import { Router, type Request, type Response } from "express";
import Product from "../models/Product.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import axios from "axios";

const router = Router();

const DUMMY_JSON_URL = "https://dummyjson.com/products";

// Proxy to DummyJSON for product listing (supports query params)
router.get("/dummyjson", async (req: Request, res: Response) => {
  try {
    const { limit = 10, skip = 0, select, ...queryParams } = req.query;
    // Build query string for DummyJSON
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (skip) params.append("skip", skip.toString());
    if (select) {
      // DummyJSON uses `select` field for field selection
      params.append("select", select as string);
    }
    // Forward other query params (like search, minPrice, maxPrice, sort) as needed?
    // DummyJSON supports search via `q` parameter.
    // We'll map our query params to DummyJSON's supported ones.
    // For simplicity, we just forward all query params as-is.
    Object.keys(req.query).forEach((key) => {
      if (key !== "limit" && key !== "skip" && key !== "select") {
        params.append(key, (req.query as any)[key]);
      }
    });

    const response = await axios.get(`${DUMMY_JSON_URL}?${params.toString()}`);
    res.json(response.data);
  } catch (err) {
    console.error("Proxy to DummyJSON error:", err);
    res.status(500).json({ error: "Failed to fetch products from DummyJSON" });
  }
});

// Proxy to DummyJSON for single product
router.get("/dummyjson/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${DUMMY_JSON_URL}/${id}`);
    res.json(response.data);
  } catch (err) {
    console.error("Proxy to DummyJSON single product error:", err);
    res.status(500).json({ error: "Failed to fetch product from DummyJSON" });
  }
});

// Public: browse active products with search, filter, sort, pagination (local products)
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
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("Products list error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// Public: single product (local)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("Product detail error:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Seller: list own products
router.get("/seller/mine", requireAuth, requireRole("seller", "admin"), async (req: Request, res: Response) => {
  const products = await Product.find({ sellerId: req.user!.id }).sort({ createdAt: -1 });
  res.json(products);
});

// Seller: create product
router.post("/", requireAuth, requireRole("seller", "admin"), async (req: Request, res: Response) => {
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
router.put("/:id", requireAuth, requireRole("seller", "admin"), async (req: Request, res: Response) => {
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

// Seller/Admin: toggle product active status
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

export default router;