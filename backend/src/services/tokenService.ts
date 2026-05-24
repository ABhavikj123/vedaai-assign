import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { IUserDocument } from "../models/User.js";

export interface AuthUserPayload {
  id: string;
  email: string;
  fullName: string;
  schoolName: string;
  schoolAddress: string;
  profileLogoUrl?: string;
  schoolLogoUrl?: string;
}

export const toAuthPayload = (user: IUserDocument): AuthUserPayload => ({
  id: user._id.toString(),
  email: user.email,
  fullName: user.fullName,
  schoolName: user.schoolName,
  schoolAddress: user.schoolAddress,
  profileLogoUrl: user.profileLogoUrl,
  schoolLogoUrl: user.schoolLogoUrl
});

export const signToken = (userId: string): string => {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };

  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    ...options
  });
};

export const verifyToken = (token: string): { sub: string } => {
  return jwt.verify(token, env.JWT_SECRET) as { sub: string };
};
