/**
 * Seed script — populates the `products` collection with sample data
 * pulled from DummyJSON, reshaped to match this app's Product model.
 *
 * Usage:
 *   1. Place this file at backend/scripts/seed.ts (adjust relative
 *      import paths below if your structure differs)
 *   2. Make sure backend/.env has MONGODB_URI set
 *   3. Run with: npx tsx scripts/seed.ts
 *      (or: npx ts-node scripts/seed.ts)
 */

import "dotenv/config";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";

const DUMMYJSON_URL = process.env.DUMMYJSON_URL || "https://dummyjson.com/products";

// Map DummyJSON's categories to this app's categories.
// Anything not mapped falls back to "other".
const CATEGORY_MAP: Record<string, string> = {
  groceries: "rice",
  fragrances: "handicraft",
  furniture: "handicraft",
  "womens-dresses": "silk",
  "mens-shirts": "silk",
};

function mapCategory(dummyCategory: string): string {
  return CATEGORY_MAP[dummyCategory] || "other";
}

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);

  console.log(`Fetching sample products from ${DUMMYJSON_URL} ...`);
  const res = await fetch(`${DUMMYJSON_URL}?limit=20`);
  if (!res.ok) {
    throw new Error(`DummyJSON request failed: ${res.status}`);
  }
  const json = await res.json();
  const items = json.products || [];

  console.log(`Fetched ${items.length} items. Inserting into MongoDB...`);

  const docs = items.map((item: any) => ({
    title: item.title,
    description: item.description || item.title,
    price: item.price,
    image: item.thumbnail || item.images?.[0] || "",
    stock: item.stock ?? 10,
    category: mapCategory(item.category),
    sellerId: "seed-script", // placeholder — not tied to a real user account
    sellerName: "Rajshahi Mart Demo",
    isActive: true,
    rating: item.rating || 0,
  }));

  const inserted = await Product.insertMany(docs);
  console.log(`Inserted ${inserted.length} products.`);

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
