import { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js"; // Assuming you have a logger utility

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error
  logger.error(`Request ${req.method} ${req.originalUrl} - ${err.message}`);
  
  // Determine the appropriate status code
  const status = err instanceof Error ? 500 : 400;
  
  // Prepare the response
  const errorResponse = {
    error: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };
  
  // Add more error details in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.details = err.stack;
  }
  
  res.status(status).json(errorResponse);
}

export const asyncWrapper = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}