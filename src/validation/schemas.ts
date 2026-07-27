import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be greater than or equal to 0"),
  image: z.string().optional(),
  stock: z.number().int().min(0, "Stock must be a non-negative integer"),
  category: z.enum(["mango", "silk", "rice", "handicraft", "other"]).default("other"),
  sellerId: z.string(),
  sellerName: z.string(),
});

export const createOrderSchema = z.object({
  buyerId: z.string(),
  buyerEmail: z.string().email(),
  items: z.array(
    z.object({
      productId: z.string(),
      sellerId: z.string(),
      title: z.string(),
      price: z.number().min(0),
      quantity: z.number().int().min(1),
    })
  ),
  amountTotal: z.number().min(0),
  currency: z.string().default("usd"),
  status: z.enum(["pending", "paid", "failed", "refunded"]).default("pending"),
  stripeSessionId: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["buyer", "seller", "admin"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});