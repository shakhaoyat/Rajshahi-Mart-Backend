import "dotenv/config";
import app from "../src/app.js";
import { connectDB } from "../src/config/db.js";

let dbPromise: Promise<void> | null = null;

async function ensureDB() {
      if (!dbPromise) {
            dbPromise = connectDB()
                  .then(() => { })
                  .catch((err) => {
                        dbPromise = null; // failed connect হলে পরের request retry করতে পারবে
                        throw err;
                  });
      }
      return dbPromise;
}

export default async function handler(req: any, res: any) {
      try {
            await ensureDB();
      } catch (err) {
            console.error("MongoDB connection failed:", err);
            res.status(500).json({ error: "Database connection failed" });
            return;
      }
      return app(req, res);
}