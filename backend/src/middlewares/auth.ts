import { asyncHandler } from "./asyncHandler.js";
import { AppError } from "./errorHandler.js";
import { User } from "../models/User.js";
import { verifyToken } from "../services/tokenService.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new AppError("Authentication token is required", 401);
  }

  const token = header.slice("Bearer ".length);

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);

    if (!user) {
      throw new AppError("Authenticated user no longer exists", 401);
    }

    req.user = user;
    next();
  } catch (jwtError) {
    throw new AppError("Your session has expired. Please log in again.", 401);
  }
});