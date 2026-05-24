export type AssignmentStatus = "pending" | "processing" | "completed" | "failed";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  schoolName: string;
  schoolAddress: string;
  profileLogoUrl?: string;
  schoolLogoUrl?: string;
}

export interface QuestionTypeRow {
  type: string;
  count: number;
  marks: number;
}

export interface GeneratedQuestion {
  id: string;
  questionText: string;
  marks: number;
  diagramSvg?: string;
}

export interface GeneratedSection {
  sectionLetter: string;
  sectionTitle: string;
  sectionInstruction: string;
  questions: GeneratedQuestion[];
}

export interface GeneratedPaper {
  schoolName: string;
  subject: string;
  class: string;
  timeAllowedMinutes: number;
  maximumMarks: number;
  generalInstructions: string[];
  sections: GeneratedSection[];
  answerKey: Array<{
    questionId: string;
    answerText: string;
  }>;
}

export interface Assignment {
  _id: string;
  title: string;
  dueDate: string;
  status: AssignmentStatus;
  totalQuestions: number;
  totalMarks: number;
  inputMetadata: {
    additionalInstructions?: string;
    uploadedFileName?: string;
    subject?: string;
    className?: string;
    timeAllowedMinutes?: number;
    questionTypes: QuestionTypeRow[];
  };
  generatedPaper?: GeneratedPaper | null;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentFormState {
  title: string;
  dueDate: string;
  subject: string;
  className: string;
  timeAllowedMinutes: number;
  instructions: string;
  file: File | null;
  questionTypes: QuestionTypeRow[];
}

export interface AppNotification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  timestamp: string;
  link: string;
  read: boolean;
}

export interface Group {
  id: string;
  name: string;
  section: string;
  studentCount: number;
  subject: string;
  assignmentIds: string[];
  createdAt: string;
}

export interface ToolkitRule {
  id: string;
  board: string;
  className: string;
  subject: string;
  language: string;
  instructions: string;
  createdAt: string;
}
