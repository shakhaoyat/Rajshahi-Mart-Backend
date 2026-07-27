import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";

// Local development entry point only. Vercel does NOT use this file —
// it uses api/index.ts instead, since Vercel runs serverless functions
// rather than a persistent server process.

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1); // fine here — this is the persistent local server, not a serverless function
  });