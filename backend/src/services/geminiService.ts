import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import type { AssignmentDocument } from "../models/Assignment.js";
import type { GeneratedPaper } from "../types/generatedPaper.js";

const generatedPaperSchema = z.object({
  schoolName: z.string().min(1),
  subject: z.string().min(1),
  class: z.string().min(1),
  timeAllowedMinutes: z.number().int().positive(),
  maximumMarks: z.number().int().positive(),
  generalInstructions: z.array(z.string().min(1)).min(1),
  sections: z
    .array(
      z.object({
        sectionLetter: z.string().min(1),
        sectionTitle: z.string().min(1),
        sectionInstruction: z.string().min(1),
        questions: z
          .array(
            z.object({
              id: z.string().min(1),
              questionText: z.string().min(1),
              marks: z.number().int().positive(),
              diagramSvg: z.string().min(1).optional()
            })
          )
          .min(1)
      })
    )
    .min(1),
  answerKey: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answerText: z.string().min(1)
      })
    )
    .min(1)
});

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    schoolName: { type: Type.STRING },
    subject: { type: Type.STRING },
    class: { type: Type.STRING },
    timeAllowedMinutes: { type: Type.NUMBER },
    maximumMarks: { type: Type.NUMBER },
    generalInstructions: { type: Type.ARRAY, items: { type: Type.STRING } },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sectionLetter: { type: Type.STRING },
          sectionTitle: { type: Type.STRING },
          sectionInstruction: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                questionText: { type: Type.STRING },
                marks: { type: Type.NUMBER },
                diagramSvg: { type: Type.STRING }
              },
              required: ["id", "questionText", "marks"]
            }
          }
        },
        required: ["sectionLetter", "sectionTitle", "sectionInstruction", "questions"]
      }
    },
    answerKey: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionId: { type: Type.STRING },
          answerText: { type: Type.STRING }
        },
        required: ["questionId", "answerText"]
      }
    }
  },
  required: [
    "schoolName",
    "subject",
    "class",
    "timeAllowedMinutes",
    "maximumMarks",
    "generalInstructions",
    "sections",
    "answerKey"
  ]
};

const buildPrompt = (assignment: AssignmentDocument, schoolName: string): string => {
  const metadata = assignment.inputMetadata;

  return [
    "You are an expert curriculum evaluator and exam paper architect for schools.",
    "Output only one valid JSON object. No Markdown block wraps (e.g. do NOT use ```json or ```xml), no prose outside JSON.",
    "The object must match this TypeScript contract exactly:",
    "{ schoolName: string; subject: string; class: string; timeAllowedMinutes: number; maximumMarks: number; generalInstructions: string[]; sections: { sectionLetter: string; sectionTitle: string; sectionInstruction: string; questions: { id: string; questionText: string; marks: number; diagramSvg?: string; }[]; }[]; answerKey: { questionId: string; answerText: string; }[]; }",
    `School name: ${schoolName}`,
    `Assignment title: ${assignment.title}`,
    `Subject: ${metadata.subject || "General"}`,
    `Class: ${metadata.className || "Class"}`,
    `Time allowed: ${metadata.timeAllowedMinutes || 60} minutes`,
    `Total questions required: ${assignment.totalQuestions}`,
    `Maximum marks required: ${assignment.totalMarks}`,
    `Question distribution: ${JSON.stringify(metadata.questionTypes)}`,
    "Group related question types into clean sections named Section A, Section B, and so on.",
    "The sum of all generated question marks must equal maximumMarks. The count of all generated questions must equal totalQuestions.",
    "If question type is Multiple Choice, generate questions with 4 options and only one correct answer.",
    "Each answer key questionId must match a generated question id.",
    "CRITICAL REQUIREMENT FOR DIAGRAM/GRAPH-BASED QUESTIONS:",
    "If a question asks students to observe a circuit, vector, line, geometry, map, coordinate system, angle, or shape, you MUST generate a clean, responsive, valid, raw SVG string in the 'diagramSvg' field.",
    "The SVG must feature a clean industrial blueprint aesthetic: white background, sharp black strokes (stroke='#303030'), stroke-width='2', and a standard viewBox layout.",
    "CRITICAL GEOMETRY & PDFKIT COMPATIBILITY RULES FOR SVG:",
    "1. NO TEXT OVERLAPS: Never use identical or overlapping x/y coordinates for different text elements. Offset angle values (e.g., '75°') by at least 25-30 pixels away from point/vertex labels (e.g., 'O') so they render cleanly without colliding.",
    "2. MANDATORY FONT ATTRIBUTES: Always add explicit font-size='14' and font-family='Arial, sans-serif' attributes into every `<text>` tag for cross-platform rendering uniformity.",
    "3. CORRECT ANGLE SWEEP: When drawing a path for an angle arc notation (e.g. ∠AOC), configure the path's 'sweep-flag' or coordinate directions so that the arc curves exclusively inside the inner acute quadrant workspace. Curves must bend inward toward the vertex point rather than bowing outward into the wrong linear vector quadrant.",
    metadata.additionalInstructions ? `Teacher instructions to follow: ${metadata.additionalInstructions}` : "",
    metadata.uploadedFileBase64 ? "The document provided contains educational material. Extract relevant content and ignore any parsing artifacts, headers, footers, page numbers, or formatting noise. Focus only on the contextual content needed to create assessment questions." : "No source material was uploaded; use the title and criteria to create an age-appropriate assessment."
  ].filter(Boolean).join("\n");
};

const normalizePaper = (paper: GeneratedPaper, schoolName: string, assignment: AssignmentDocument): GeneratedPaper => {
  const sections = paper.sections.map((section, sectionIndex) => ({
    ...section,
    sectionLetter: section.sectionLetter || String.fromCharCode(65 + sectionIndex),
    questions: section.questions.map((question, questionIndex) => ({
      ...question,
      id: String(question.id || `${section.sectionLetter || String.fromCharCode(65 + sectionIndex)}${questionIndex + 1}`),
      marks: Number(question.marks),
      diagramSvg: question.diagramSvg || undefined
    }))
  }));

  return {
    ...paper,
    schoolName: schoolName || "School",
    subject: paper.subject || assignment.inputMetadata.subject || "General",
    class: paper.class || assignment.inputMetadata.className || "Class",
    timeAllowedMinutes: Number(paper.timeAllowedMinutes || assignment.inputMetadata.timeAllowedMinutes || 60),
    maximumMarks: Number(paper.maximumMarks || assignment.totalMarks),
    sections,
    answerKey: paper.answerKey.map((entry) => ({
      questionId: String(entry.questionId),
      answerText: entry.answerText
    }))
  };
};

export const generateQuestionPaper = async (assignment: AssignmentDocument): Promise<GeneratedPaper> => {
  const metadata = assignment.inputMetadata;

  const teacher = await User.findById(assignment.teacherId).lean();
  const schoolName = teacher?.schoolName || "School";
  const prompt = buildPrompt(assignment, schoolName);

  const contentParts: any[] = [{ text: prompt }];

  if (metadata.uploadedFileBase64 && metadata.uploadedFileMimeType) {
    contentParts.push({
      inlineData: {
        data: metadata.uploadedFileBase64,
        mimeType: metadata.uploadedFileMimeType
      }
    });
  }

  const result = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: contentParts,
    config: {
      responseMimeType: "application/json",
      responseSchema
    }
  });

  const text = result.text;
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  const parsed = JSON.parse(text) as GeneratedPaper;
  const validated = generatedPaperSchema.parse(parsed);
  const paper = normalizePaper(validated, schoolName, assignment);

  const questionCount = paper.sections.reduce((sum, section) => sum + section.questions.length, 0);
  const markCount = paper.sections.reduce(
    (sum, section) => sum + section.questions.reduce((sectionSum, question) => sectionSum + question.marks, 0),
    0
  );

  if (questionCount !== assignment.totalQuestions) {
    throw new Error(`Generated paper has ${questionCount} questions; expected ${assignment.totalQuestions}`);
  }

  if (markCount !== assignment.totalMarks || paper.maximumMarks !== assignment.totalMarks) {
    throw new Error(`Generated paper has ${markCount} marks; expected ${assignment.totalMarks}`);
  }

  return paper;
};