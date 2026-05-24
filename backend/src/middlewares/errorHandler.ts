import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import multer from "multer";
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

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (
  error: HttpError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("[Request Error Exception Log]:", error);

  if (error instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: error.flatten().fieldErrors
    });
  }

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.code === "LIMIT_FILE_SIZE" ? "Uploaded file must be 8MB or smaller" : error.message
    });
  }

  const statusCode = (error as HttpError).statusCode || 500;
  
  const message = statusCode === 500 
    ? "Internal server error" 
    : error.message;

  const payload: Record<string, unknown> = {
    success: false,
    message
  };

  if (env.NODE_ENV !== "production") {
    payload.detail = error.message;
    payload.stack = error.stack;
  }

  return res.status(statusCode).json(payload);
};