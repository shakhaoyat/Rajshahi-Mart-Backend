import type { Request, Response, NextFunction } from "express";
import type { Role } from "../types/auth.js";

// Usage: requireRole("seller") or requireRole("seller", "admin")
// Must run after requireAuth so req.user is populated.
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: requires role ${allowedRoles.join(" or ")}`,
      });
    }
    next();
  };
}
