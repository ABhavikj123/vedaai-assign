import { Router } from "express";
import { updateProfileSettings } from "../controllers/profileController.js";
import { protect } from "../middlewares/auth.js";

export const profileRouter = Router();

profileRouter.put("/settings", protect, updateProfileSettings);
