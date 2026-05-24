import mongoose from "mongoose";
import { z } from "zod";
import { Assignment } from "../models/Assignment.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../middlewares/errorHandler.js";
import { enqueueAssignmentGeneration } from "../queues/assignmentQueue.js";
import {
  getCachedAssignment,
  getCachedAssignmentList,
  invalidateAssignmentCaches,
  setCachedAssignment,
  setCachedAssignmentList,
  setCachedAssignmentStatus
} from "../services/assignmentCacheService.js";
import { extractFileData } from "../services/fileTextService.js";
import { streamAssignmentPdf } from "../services/pdfService.js";

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

  const cached = await getCachedAssignment<{ teacherId?: unknown }>(assignmentId);
  if (cached) {
    if (String(cached.teacherId) === teacherId) {
      return cached;
    }
  }

  const assignment = await Assignment.findOne({ _id: assignmentId, teacherId }).lean();
  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  await setCachedAssignment(assignmentId, assignment);
  return assignment;
};

const getRouteId = (value: string | string[] | undefined): string => {
  if (typeof value !== "string") {
    throw new AppError("Assignment id is required", 400);
  }

  return value;
};

const withTimeout = async <T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_resolve, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
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
    void invalidateAssignmentCaches(teacherId, assignment._id.toString());
    await withTimeout(
      enqueueAssignmentGeneration({
        assignmentId: assignment._id.toString(),
        teacherId
      }),
      8000,
      "Assignment generation queue timed out"
    );
  } catch (error) {
    await Assignment.updateOne({ _id: assignment._id }, { status: "failed", failureReason: error instanceof Error ? `Queue unavailable: ${error.message}` : "Queue unavailable" });
    void invalidateAssignmentCaches(teacherId, assignment._id.toString());
    void setCachedAssignmentStatus(assignment._id.toString(), "failed");
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

  const cached = await getCachedAssignmentList(teacherId);
  if (cached) {
    return res.json({
      success: true,
      assignments: cached
    });
  }

  const assignments = await Assignment.find({ teacherId }).sort({ createdAt: -1 }).lean();
  void setCachedAssignmentList(teacherId, assignments);

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

  const assignment = await Assignment.findOneAndUpdate(
    { _id: assignmentId, teacherId },
    { status: "pending", generatedPaper: null, $unset: { failureReason: "" } },
    { new: true }
  ).lean();

  if (!assignment) {
    throw new AppError("Assignment not found", 404);
  }

  void invalidateAssignmentCaches(teacherId, assignmentId);
  void setCachedAssignmentStatus(assignmentId, "pending");

  try {
    await withTimeout(
      enqueueAssignmentGeneration({
        assignmentId,
        teacherId
      }),
      8000,
      "Assignment generation queue timed out"
    );
  } catch (error) {
    await Assignment.updateOne({ _id: assignmentId }, { status: "failed", failureReason: error instanceof Error ? `Queue unavailable: ${error.message}` : "Queue unavailable" });
    void invalidateAssignmentCaches(teacherId, assignmentId);
    void setCachedAssignmentStatus(assignmentId, "failed");
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

  const result = await Assignment.deleteOne({ _id: assignmentId, teacherId });

  if (result.deletedCount === 0) {
    throw new AppError("Assignment not found", 404);
  }

  void invalidateAssignmentCaches(teacherId, assignmentId);

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
