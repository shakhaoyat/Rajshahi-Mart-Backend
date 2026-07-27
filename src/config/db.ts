import mongoose from "mongoose";

// Serverless-safe MongoDB connection.
// - Caches the connection promise so warm invocations (same container
//   reused by Vercel) don't try to reconnect.
// - Does NOT call process.exit() on failure — killing the process is
//   fine for a long-running local server, but in a serverless function
//   it can affect other in-flight invocations. Instead we throw, so the
//   caller (api/index.ts) can return a proper error response.

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  // mongoose.connection.readyState 1 = connected, already good to go
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI as string)
      .then((conn) => {
        console.log("MongoDB connected (mongoose)");
        return conn;
      })
      .catch((err) => {
        connectionPromise = null; // allow retry on next call
        console.error("MongoDB connection error:", (err as Error).message);
        throw err;
      });
  }

  return connectionPromise;
}