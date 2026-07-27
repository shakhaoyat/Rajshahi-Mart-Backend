import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  // Generate request ID (built-in, no extra dependency needed)
  const requestId = randomUUID();

  // Log the error with structured data
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    path: req.originalUrl,
    error: err.message,
    stack: err.stack,
  }));

  // Determine the appropriate status code
  const status = err instanceof Error ? 500 : 400;

  // Prepare the response
  const errorResponse: {
    error: string;
    timestamp: string;
    path: string;
    requestId: string;
    details?: string;
  } = {
    error: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    requestId,
  };

  // Add more error details in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.details = err.stack;
  }

  res.status(status).json(errorResponse);
}