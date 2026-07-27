import type { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import type { AuthUser, AuthSession } from "../types/auth.js";

// Reads the Better Auth session cookie from the incoming request and
// attaches { user, session } to req. Rejects with 401 if not signed in.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    req.user = session.user as unknown as AuthUser;
    req.session = session.session as unknown as AuthSession;
    next();
  } catch (err) {
    console.error("requireAuth error:", err);
    res.status(401).json({ error: "Not authenticated" });
  }
}
