import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
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
