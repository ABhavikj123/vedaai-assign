import mongoose from "mongoose";
import { z } from "zod";
import { Assignment } from "../models/Assignment.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../middlewares/errorHandler.js";
import { enqueueAssignmentGeneration } from "../queues/assignmentQueue.js";
import { extractFileData } from "../services/fileTextService.js";
import { streamAssignmentPdf } from "../services/pdfService.js";
import { cacheClient } from "../config/redis.js";

const questionTypeSchema = z.object({
  type: z.string().trim().min(1),
  count: z.coerce.number().int().positive(),
  marks: z.coerce.number().int().positive(),
});

const createAssignmentSchema = z.object({
  title: z.string().trim().min(1),
  due_date: z.coerce.date(),
  subject: z.string().trim().min(1).default("General"),
  className: z.string().trim().min(1).default("Class"),
  timeAllowedMinutes: z.coerce.number().int().positive().default(60),
  question_types: z.array(questionTypeSchema).min(1),
  instructions: z.string().trim().optional(),
  uploadedFileUrl: z.string().trim().optional()
});

const parseQuestionTypes = (value: unknown): unknown => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeCreateBody = (body: Record<string, unknown>) => ({
  ...body,
  due_date: body.due_date ?? body.dueDate,
  instructions: body.instructions ?? body.additionalInstructions,
  question_types: parseQuestionTypes(body.question_types ?? body.questionTypes),
  totalQuestions: body.totalQuestions,
  totalMarks: body.totalMarks
});

const getOwnedAssignment = async (assignmentId: string, teacherId: string) => {
  if (!mongoose.isValidObjectId(assignmentId)) {
    throw new AppError("Invalid assignment id", 400);
  }

  const cacheKey = `assignment:${assignmentId}`;
  const cached = await cacheClient.get(cacheKey);
  if (cached) {
    const assignment = JSON.parse(cached);
    if (assignment.teacherId === teacherId) {
      return assignment;
    }
  }

  const assignment = await Assignment.findOne({ _id: assignmentId, teacherId }).lean();
  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  await cacheClient.set(cacheKey, JSON.stringify(assignment), "EX", 600);
  return assignment;
};

const getRouteId = (value: string | string[] | undefined): string => {
  if (typeof value !== "string") {
    throw new AppError("Assignment id is required", 400);
  }

  return value;
};

export const createAssignment = asyncHandler(async (req, res) => {
  const teacherId = req.user!._id.toString();
  const body = createAssignmentSchema.parse(normalizeCreateBody(req.body as Record<string, unknown>));
  const fileData = await extractFileData(req.file);

  if (!body.instructions && !fileData && !body.uploadedFileUrl) {
    throw new AppError("Either instructions or an uploaded PDF/text file is required", 422);
  }

  if (body.due_date.getTime() <= Date.now()) {
    throw new AppError("Due date must be in the future", 422);
  }

  const totalQuestions = body.question_types.reduce((sum, questionType) => sum + questionType.count, 0);
  const totalMarks = body.question_types.reduce((sum, questionType) => sum + questionType.count * questionType.marks, 0);

  const assignment = await Assignment.create({
    teacherId: req.user!._id,
    title: body.title,
    dueDate: body.due_date,
    status: "pending",
    totalQuestions,
    totalMarks,
    inputMetadata: {
      additionalInstructions: body.instructions || "",
      uploadedFileUrl: body.uploadedFileUrl,
      uploadedFileName: fileData?.fileName,
      uploadedFileBase64: fileData?.base64,
      uploadedFileMimeType: fileData?.mimeType,
      uploadedFileSize: req.file?.size,
      schoolName: req.user!.schoolName,
      subject: body.subject,
      className: body.className,
      timeAllowedMinutes: body.timeAllowedMinutes,
      questionTypes: body.question_types
    },
    generatedPaper: null
  });

  try {
    await cacheClient.del(`teacher:${teacherId}:assignments`);
    await enqueueAssignmentGeneration({
      assignmentId: assignment._id.toString(),
      teacherId
    });
  } catch (error) {
    await Assignment.updateOne({ _id: assignment._id }, { status: "failed", failureReason: error instanceof Error ? `Queue unavailable: ${error.message}` : "Queue unavailable" });
    await cacheClient.set(`assignment:${assignment._id}:status`, "failed", "EX", 3600);
    throw new AppError("AI generation queue is unavailable. Please check Redis and try again.", 503);
  }

  return res.status(202).json({
    success: true,
    assignmentId: assignment._id,
    status: assignment.status
  });
});

export const listAssignments = asyncHandler(async (req, res) => {
  const teacherId = req.user!._id.toString();
  const cacheKey = `teacher:${teacherId}:assignments`;

  const cached = await cacheClient.get(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      assignments: JSON.parse(cached)
    });
  }

  const assignments = await Assignment.find({ teacherId }).sort({ createdAt: -1 }).lean();
  await cacheClient.set(cacheKey, JSON.stringify(assignments), "EX", 300);

  return res.json({
    success: true,
    assignments
  });
});

export const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await getOwnedAssignment(getRouteId(req.params.id), req.user!._id.toString());

  return res.json({
    success: true,
    assignment
  });
});

export const regenerateAssignment = asyncHandler(async (req, res) => {
  const teacherId = req.user!._id.toString();
  const assignmentId = getRouteId(req.params.id);

  await Assignment.updateOne(
    { _id: assignmentId, teacherId },
    { status: "pending", generatedPaper: null, $unset: { failureReason: "" } }
  );

  await cacheClient.del(`assignment:${assignmentId}`);
  await cacheClient.del(`teacher:${teacherId}:assignments`);

  try {
    await enqueueAssignmentGeneration({
      assignmentId,
      teacherId
    });
  } catch (error) {
    await Assignment.updateOne({ _id: assignmentId }, { status: "failed", failureReason: error instanceof Error ? `Queue unavailable: ${error.message}` : "Queue unavailable" });
    await cacheClient.set(`assignment:${assignmentId}:status`, "failed", "EX", 3600);
    throw new AppError("AI generation queue is unavailable. Please check Redis and try again.", 503);
  }

  return res.status(202).json({
    success: true,
    assignmentId,
    status: "pending"
  });
});

export const deleteAssignment = asyncHandler(async (req, res) => {
  const teacherId = req.user!._id.toString();
  const assignmentId = getRouteId(req.params.id);

  await Assignment.deleteOne({ _id: assignmentId, teacherId });

  await cacheClient.del(`assignment:${assignmentId}`);
  await cacheClient.del(`teacher:${teacherId}:assignments`);

  return res.json({
    success: true
  });
});

export const downloadAssignmentPdf = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findOne({ _id: getRouteId(req.params.id), teacherId: req.user!._id.toString() });
  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  if (assignment.status !== "completed" || !assignment.generatedPaper) {
    throw new AppError("PDF is available only after generation completes", 409);
  }

  streamAssignmentPdf(assignment, res);
});