import { z } from "zod";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { toAuthPayload } from "../services/tokenService.js";
import { cacheClient } from "../config/redis.js";

const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  schoolName: z.string().trim().min(2).optional(),
  schoolAddress: z.string().trim().min(2).optional(),
  profileLogoUrl: z.string().trim().min(1).optional(),
  schoolLogoUrl: z.string().trim().min(1).optional()
});

export const updateProfileSettings = asyncHandler(async (req, res) => {
  const body = profileUpdateSchema.parse(req.body);
  const user = req.user!;

  Object.assign(user, body);
  await user.save();

  const teacherId = user._id.toString();
  const cacheKey = `teacher:${teacherId}:profile`;
  
  await cacheClient.set(cacheKey, JSON.stringify(toAuthPayload(user)), "EX", 1200);

  return res.json({
    success: true,
    user: toAuthPayload(user)
  });
});