export interface QuestionTypeRequest {
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

export interface AnswerKeyEntry {
  questionId: string;
  answerText: string;
}

export interface GeneratedPaper {
  schoolName: string;
  subject: string;
  class: string;
  timeAllowedMinutes: number;
  maximumMarks: number;
  generalInstructions: string[];
  sections: GeneratedSection[];
  answerKey: AnswerKeyEntry[];
}
