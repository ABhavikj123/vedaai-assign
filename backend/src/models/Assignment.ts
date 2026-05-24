import { Schema, model, Types, type HydratedDocument } from "mongoose";
import type { GeneratedPaper, QuestionTypeRequest } from "../types/generatedPaper.js";

export type AssignmentStatus = "pending" | "processing" | "completed" | "failed";

export interface AssignmentInputMetadata {
  additionalInstructions?: string;
  uploadedFileUrl?: string;
  uploadedFileName?: string;
  uploadedFileBase64?: string;
  uploadedFileMimeType?: string;
  uploadedFileSize?: number;
  schoolName?: string;
  subject?: string;
  className?: string;
  timeAllowedMinutes?: number;
  questionTypes: QuestionTypeRequest[];
}

export interface IAssignment {
  teacherId: Types.ObjectId;
  title: string;
  dueDate: Date;
  status: AssignmentStatus;
  totalQuestions: number;
  totalMarks: number;
  inputMetadata: AssignmentInputMetadata;
  generatedPaper?: GeneratedPaper | null;
  failureReason?: string;
}

export type AssignmentDocument = HydratedDocument<IAssignment>;

const questionTypeSchema = new Schema<QuestionTypeRequest>(
  {
    type: { type: String, required: true, trim: true },
    count: { type: Number, required: true, min: 1 },
    marks: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const generatedQuestionSchema = new Schema(
  {
    id: { type: String, required: true },
    questionText: { type: String, required: true, trim: true },
    marks: { type: Number, required: true, min: 1 },
    diagramSvg: { type: String, required: false }
  },
  { _id: false }
);

const generatedSectionSchema = new Schema(
  {
    sectionLetter: { type: String, required: true },
    sectionTitle: { type: String, required: true },
    sectionInstruction: { type: String, required: true },
    questions: { type: [generatedQuestionSchema], default: [] }
  },
  { _id: false }
);

const answerKeySchema = new Schema(
  {
    questionId: { type: String, required: true },
    answerText: { type: String, required: true }
  },
  { _id: false }
);

const generatedPaperSchema = new Schema<GeneratedPaper>(
  {
    schoolName: { type: String, required: true },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    timeAllowedMinutes: { type: Number, required: true, min: 1 },
    maximumMarks: { type: Number, required: true, min: 1 },
    generalInstructions: { type: [String], default: [] },
    sections: { type: [generatedSectionSchema], default: [] },
    answerKey: { type: [answerKeySchema], default: [] }
  },
  { _id: false }
);

const assignmentSchema = new Schema<IAssignment>(
  {
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1
    },
    inputMetadata: {
      additionalInstructions: { type: String, default: "" },
      uploadedFileUrl: { type: String },
      uploadedFileName: { type: String },
      uploadedFileText: { type: String },
      subject: { type: String, default: "General" },
      className: { type: String, default: "Class" },
      timeAllowedMinutes: { type: Number, default: 60, min: 1 },
      questionTypes: { type: [questionTypeSchema], default: [] }
    },
    generatedPaper: {
      type: generatedPaperSchema,
      default: null
    },
    failureReason: {
      type: String
    }
  },
  { timestamps: true }
);

export const Assignment = model<IAssignment>("Assignment", assignmentSchema);
