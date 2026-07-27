import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { db } from "../lib/auth.js";

const router = Router();

// PATCH /api/user/profile
// Update the logged-in user's profile picture.
router.patch("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const { profilePicture } = req.body;
    // Validate: profilePicture must be a string (can be empty)
    if (typeof profilePicture !== "string") {
      return res.status(400).json({ error: "profilePicture must be a string" });
    }
    // Optionally, you could validate that it's a valid URL, but we'll just store it.

    const userId = req.user?.id; // This is the user id string from Better Auth
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Update the user document in the 'user' collection.
    // We match by the 'id' field (which is the string id used by Better Auth).
    const result = await db.collection("user").updateOne(
      { id: userId },
      {
        $set: {
          profilePicture: profilePicture.trim(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;