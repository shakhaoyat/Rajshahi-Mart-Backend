import { Request, Response, NextFunction } from "express";
import { createProductSchema } from "../validation/schemas.js";

export const validateProduct = (req: Request, res: Response, next: NextFunction) => {
  try {
    createProductSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    } else {
      res.status(500).json({ error: "Server error" });
    }
  }
};