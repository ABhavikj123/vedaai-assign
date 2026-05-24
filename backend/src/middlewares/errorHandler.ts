import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

interface HttpError extends Error {
  statusCode?: number;
}

export const notFoundHandler: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (
  error: HttpError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: error.flatten().fieldErrors
    });
  }

  const statusCode = error.statusCode || 500;
  const payload: Record<string, unknown> = {
    success: false,
    message: statusCode === 500 ? "Internal server error" : error.message
  };

  if (env.NODE_ENV !== "production") {
    payload.detail = error.message;
    payload.stack = error.stack;
  }

  return res.status(statusCode).json(payload);
};
