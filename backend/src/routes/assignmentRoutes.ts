import { Router } from "express";
import multer from "multer";
import {
  createAssignment,
  deleteAssignment,
  downloadAssignmentPdf,
  getAssignment,
  listAssignments,
  regenerateAssignment
} from "../controllers/assignmentController.js";
import { protect } from "../middlewares/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    const allowed = file.mimetype === "application/pdf" || file.mimetype.startsWith("text/");
    if (!allowed) {
      callback(new Error("Only PDF and text files are supported"));
      return;
    }
    callback(null, true);
  }
});

export const assignmentRouter = Router();

assignmentRouter.use(protect);
assignmentRouter.post("/create", upload.single("file"), createAssignment);
assignmentRouter.get("/", listAssignments);
assignmentRouter.get("/:id/download-pdf", downloadAssignmentPdf);
assignmentRouter.get("/:id", getAssignment);
assignmentRouter.post("/:id/regenerate", regenerateAssignment);
assignmentRouter.delete("/:id", deleteAssignment);
