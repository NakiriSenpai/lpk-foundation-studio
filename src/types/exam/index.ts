/** Tipe domain Exam Studio (Sprint 6). */

export type ExamStatus = "draft" | "published" | "archived";
export type ExamDifficulty = "mudah" | "sedang" | "sulit";
export type ExamSectionType = "reading" | "listening";
export type AnswerLabel = "A" | "B" | "C" | "D";

/** Baris tabel public.exams */
export type ExamRow = {
  id: string;
  tenant_id: string | null;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  difficulty: ExamDifficulty;
  passing_score: number;
  duration_minutes: number;
  status: ExamStatus;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  total_score: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Baris tabel public.exam_sections */
export type ExamSectionRow = {
  id: string;
  exam_id: string;
  type: ExamSectionType;
  title: string;
  instruction: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

/** Baris tabel public.exam_questions — Exam hanya menyimpan referensi soal. */
export type ExamQuestionRow = {
  id: string;
  exam_id: string;
  section_id: string;
  order_index: number;
  text: string;
  image_url: string | null;
  audio_url: string | null;
  grammar_tag: string | null;
  explanation: string | null;
  lesson_ref: string | null;
  created_at: string;
  updated_at: string;
};

/** Baris tabel public.exam_answers */
export type ExamAnswerRow = {
  id: string;
  question_id: string;
  label: AnswerLabel;
  text: string | null;
  image_url: string | null;
  audio_url: string | null;
  is_correct: boolean;
  created_at: string;
};

export type ExamQuestionWithAnswers = ExamQuestionRow & { answers: ExamAnswerRow[] };

export type ExamInput = {
  title: string;
  slug: string;
  category: string;
  description: string;
  difficulty: ExamDifficulty;
  passing_score: number;
  duration_minutes: number;
  status: ExamStatus;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
};

export type SectionInput = {
  type: ExamSectionType;
  title: string;
  instruction: string;
};

export type AnswerInput = {
  label: AnswerLabel;
  text: string;
  image_url: string | null;
  audio_url: string | null;
  is_correct: boolean;
};

export type QuestionInput = {
  text: string;
  image_url: string | null;
  audio_url: string | null;
  grammar_tag: string;
  explanation: string;
  lesson_ref: string;
  answers: AnswerInput[];
};

export const EXAM_TABLES = {
  exams: "exams",
  sections: "exam_sections",
  questions: "exam_questions",
  answers: "exam_answers",
} as const;
