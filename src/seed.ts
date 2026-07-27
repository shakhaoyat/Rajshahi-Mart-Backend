import "dotenv/config";
import mongoose from "mongoose";
import { auth } from "./lib/auth.js";
import Product from "./models/Product.js";

// Demo accounts (idempotent — signUpEmail is skipped if the email already
// exists). Use these to log in and explore each role immediately.
const DEMO_ACCOUNTS = [
  { name: "Rajshahi Admin", email: "admin@rajshahimart.com", password: "admin12345", role: "admin" },
  { name: "Rajshahi Silk House", email: "seller@rajshahimart.com", password: "seller12345", role: "seller" },
  { name: "Karim Rahman", email: "buyer@rajshahimart.com", password: "buyer12345", role: "buyer" },
] as const;

// Dummy catalog themed around Rajshahi, Bangladesh — famous for mangoes,
// silk, rice, and sweets. Images are simple color-matched placeholders
// (no real/copyrighted product photography).
function catalog(sellerId: string, sellerName: string) {
  const img = (label: string) =>
    `https://placehold.co/600x400/16A34A/ffffff?text=${encodeURIComponent(label)}`;

  return [
    {
      title: "Rajshahi Fazli Mango (5kg box)",
      description:
        "Sweet, fiber-free Fazli mangoes grown in the orchards around Rajshahi. Hand-picked at peak ripeness and boxed the same day.",
      price: 18.99,
      stock: 40,
      category: "mango",
      image: img("Fazli Mango"),
    },
    {
      title: "Khirsapati (Himsagar) Mango (5kg box)",
      description: "Aromatic, non-fibrous Himsagar mangoes — a Rajshahi specialty prized across Bangladesh.",
      price: 21.5,
      stock: 35,
      category: "mango",
      image: img("Himsagar Mango"),
    },
    {
      title: "Rajshahi Silk Saree — Handwoven",
      description: "Pure mulberry silk saree handwoven by local artisans, featuring traditional Rajshahi motifs.",
      price: 89.0,
      stock: 15,
      category: "silk",
      image: img("Silk Saree"),
    },
    {
      title: "Silk Panjabi (Men's Kurta)",
      description: "Lightweight silk panjabi, tailored and finished in Rajshahi's silk workshops.",
      price: 45.0,
      stock: 20,
      category: "silk",
      image: img("Silk Panjabi"),
    },
    {
      title: "Silk Scarf — Hand Printed",
      description: "Soft mulberry silk scarf with a hand-block-printed floral pattern.",
      price: 15.0,
      stock: 60,
      category: "silk",
      image: img("Silk Scarf"),
    },
    {
      title: "Premium Chinigura Rice (10kg)",
      description: "Fragrant, short-grain Chinigura rice grown in the fields of Rajshahi division.",
      price: 24.0,
      stock: 50,
      category: "rice",
      image: img("Chinigura Rice"),
    },
    {
      title: "Kalijira Rice (5kg)",
      description: "Aromatic miniature-grain rice, ideal for pulao and biryani.",
      price: 16.5,
      stock: 45,
      category: "rice",
      image: img("Kalijira Rice"),
    },
    {
      title: "Rajshahi Silk Tie",
      description: "Classic silk necktie woven in Rajshahi, available in solid and striped patterns.",
      price: 12.0,
      stock: 70,
      category: "silk",
      image: img("Silk Tie"),
    },
    {
      title: "Tokti (Rajshahi Sweet, 1kg box)",
      description: "A traditional milk-based Rajshahi sweet — soft, delicately spiced, and freshly made.",
      price: 9.5,
      stock: 55,
      category: "handicraft",
      image: img("Tokti Sweet"),
    },
    {
      title: "Rajshahi Mango Pickle (500g jar)",
      description: "Tangy, spiced green mango pickle made in small batches using a family recipe.",
      price: 6.0,
      stock: 80,
      category: "mango",
      image: img("Mango Pickle"),
    },
    {
      title: "Dried Mango Slices (250g)",
      description: "Naturally sun-dried Fazli mango slices with no added sugar — a chewy, sweet snack.",
      price: 5.5,
      stock: 90,
      category: "mango",
      image: img("Dried Mango"),
    },
    {
      title: "Terracotta Handicraft Vase",
      description: "Hand-molded terracotta vase from Rajshahi's traditional pottery villages.",
      price: 14.0,
      stock: 25,
      category: "handicraft",
      image: img("Terracotta Vase"),
    },
    {
      title: "Bamboo Handwoven Basket",
      description: "Durable bamboo basket handwoven by local craftspeople, great for storage or gifting.",
      price: 11.0,
      stock: 40,
      category: "handicraft",
      image: img("Bamboo Basket"),
    },
    {
      title: "Rajshahi Mango Jam (400g jar)",
      description: "Slow-cooked mango jam made from ripe Khirsapati mangoes — no artificial preservatives.",
      price: 7.25,
      stock: 65,
      category: "mango",
      image: img("Mango Jam"),
    },
  ].map((p) => ({ ...p, sellerId, sellerName, isActive: true }));
}

async function upsertDemoUser(account: (typeof DEMO_ACCOUNTS)[number]) {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: account.name,
        email: account.email,
        password: account.password,
        role: account.role,
      },
    });
    console.log(`Created ${account.role} account: ${account.email}`);
    return result.user.id as string;
  } catch (err) {
    // Already exists — look it up instead via the raw user collection.
    const db = mongoose.connection.db!;
    const existing = await db.collection("user").findOne({ email: account.email });
    if (existing) {
      console.log(`${account.role} account already exists: ${account.email}`);
      return existing.id as string;
    }
    throw err;
  }
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB for seeding Rajshahi Mart...\n");

  const userIds: Record<string, string> = {};
  for (const account of DEMO_ACCOUNTS) {
    userIds[account.role] = await upsertDemoUser(account);
  }

  console.log("\nSeeding product catalog...");
  await Product.deleteMany({ sellerId: userIds.seller });
  const products = catalog(userIds.seller, "Rajshahi Silk House");
  await Product.insertMany(products);
  console.log(`Inserted ${products.length} products.\n`);

  console.log("Demo logins:");
  for (const a of DEMO_ACCOUNTS) {
    console.log(`  ${a.role.padEnd(6)} — ${a.email} / ${a.password}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
