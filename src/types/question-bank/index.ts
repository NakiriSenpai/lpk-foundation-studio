/** Tipe domain Question Bank (Sprint 7). */

import type { ExamDifficulty } from "@/types/exam";

export type QuestionSourceType = "exam" | "lesson" | "import" | "manual";
export type MediaFilter = "semua" | "image" | "audio" | "none";

export type GrammarTagRow = {
  id: string;
  slug: string;
  name: string;
};

export type LessonRow = {
  id: string;
  title: string;
  slug?: string;
};

export type QuestionAnswerRow = {
  id: string;
  question_id: string;
  label: "A" | "B" | "C" | "D";
  text: string | null;
  image_url: string | null;
  audio_url: string | null;
  is_correct: boolean;
};

export type QuestionBankRow = {
  id: string;
  tenant_id: string | null;
  text: string;
  image_url: string | null;
  audio_url: string | null;
  explanation: string | null;
  category: string;
  difficulty: ExamDifficulty;
  lesson_id: string | null;
  source_type: QuestionSourceType;
  created_from: string | null;
  used_count: number;
  last_used_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  answers: QuestionAnswerRow[];
  grammar_tags: GrammarTagRow[];
  lesson: LessonRow | null;
};

export type QuestionAnswerInput = {
  label: "A" | "B" | "C" | "D";
  text: string;
  image_url: string | null;
  audio_url: string | null;
  is_correct: boolean;
};

export type QuestionBankInput = {
  text: string;
  image_url: string | null;
  audio_url: string | null;
  explanation: string;
  category: string;
  difficulty: ExamDifficulty;
  lesson_id: string | null;
  source_type: QuestionSourceType;
  created_from: string | null;
  grammar_tag_ids: string[];
  answers: QuestionAnswerInput[];
};

export type QuestionBankFilters = {
  search?: string;
  source?: "semua" | QuestionSourceType;
  grammar?: "semua" | string;
  category?: "semua" | string;
  difficulty?: "semua" | ExamDifficulty;
  media?: MediaFilter;
  page?: number;
  pageSize?: number;
};

export type QuestionBankResult = {
  rows: QuestionBankRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export const QUESTION_TABLES = {
  questions: "questions",
  answers: "question_answers",
  grammarTags: "grammar_tags",
  questionGrammarTags: "question_grammar_tags",
  lessons: "lessons",
} as const;

export const SOURCE_LABELS: Record<QuestionSourceType, string> = {
  exam: "Exam Studio",
  lesson: "Lesson Studio",
  import: "Import",
  manual: "Manual",
};
