import { Router, type Request, type Response } from "express";
import { MongoClient, type Collection } from "mongodb";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import type { Role } from "../types/auth.js";

const router = Router();
const client = new MongoClient(process.env.MONGODB_URI as string);

interface UserDoc {
  id: string;
  name: string;
  email: string;
  role: Role;
}

let usersCollection: Collection<UserDoc> | undefined;
async function getUsers(): Promise<Collection<UserDoc>> {
  if (!usersCollection) {
    await client.connect();
    usersCollection = client.db().collection<UserDoc>("user"); // Better Auth's collection
  }
  return usersCollection;
}

router.use(requireAuth, requireRole("admin"));

// List all users
router.get("/users", async (_req: Request, res: Response) => {
  const users = await getUsers();
  const all = await users.find({}, { projection: { password: 0 } }).toArray();
  res.json(all);
});

// Change a user's role
router.patch("/users/:id/role", async (req: Request, res: Response) => {
  const { role } = req.body as { role: Role };
  if (!["buyer", "seller", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  const users = await getUsers();
  await users.updateOne({ id: req.params.id }, { $set: { role } });
  res.json({ success: true });
});

// All products (moderation)
router.get("/products", async (_req: Request, res: Response) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// All orders
router.get("/orders", async (_req: Request, res: Response) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

export default router;
