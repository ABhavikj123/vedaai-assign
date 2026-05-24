import { z } from "zod";
import { User } from "../models/User.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../middlewares/errorHandler.js";
import { signToken, toAuthPayload } from "../services/tokenService.js";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/\d/, "Password must contain a number");

const signupSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: passwordSchema,
  fullName: z.string().trim().min(2),
  schoolName: z.string().trim().min(2),
  schoolAddress: z.string().trim().min(2),
  profileLogoUrl: z.string().trim().optional(),
  schoolLogoUrl: z.string().trim().optional()
});

const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1)
});

export const signup = asyncHandler(async (req, res) => {
  const body = signupSchema.parse(req.body);
  const existingUser = await User.findOne({ email: body.email });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const user = await User.create(body);
  const token = signToken(user._id.toString());

  return res.status(201).json({
    success: true,
    token,
    user: toAuthPayload(user)
  });
});

export const login = asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await User.findOne({ email: body.email }).select("+password");

  if (!user || !(await user.comparePassword(body.password))) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken(user._id.toString());

  return res.json({
    success: true,
    token,
    user: toAuthPayload(user)
  });
});
