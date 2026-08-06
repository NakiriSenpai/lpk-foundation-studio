import { supabase } from "@/lib/supabase/client";
import {
  EXAM_TABLES,
  type ExamAnswerRow,
  type ExamInput,
  type ExamQuestionRow,
  type ExamQuestionWithAnswers,
  type ExamRow,
  type ExamSectionRow,
  type ExamStatus,
  type QuestionInput,
  type SectionInput,
} from "@/types/exam";

export type ExamStatusFilter = "semua" | ExamStatus;
export type ExamCategoryFilter = "semua" | string;

export type ExamListParams = {
  search?: string;
  status?: ExamStatusFilter;
  category?: ExamCategoryFilter;
  page?: number;
  pageSize?: number;
};

export type ExamListResult = {
  rows: ExamRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Daftar exam dengan pencarian, filter status/kategori, dan pagination. */
export async function listExams({
  search = "",
  status = "semua",
  category = "semua",
  page = 1,
  pageSize = 10,
}: ExamListParams = {}): Promise<ExamListResult> {
  const from = (page - 1) * pageSize;
  let query = supabase
    .from(EXAM_TABLES.exams)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const term = search.trim().replace(/[%,()]/g, "");
  if (term) query = query.or(`title.ilike.%${term}%,slug.ilike.%${term}%`);
  if (status !== "semua") query = query.eq("status", status);
  if (category !== "semua") query = query.eq("category", category);

  const { data, error, count } = await query;
  if (error) throw new Error("Gagal memuat daftar exam.");

  const total = count ?? 0;
  return {
    rows: (data as ExamRow[] | null) ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getExam(examId: string): Promise<ExamRow> {
  const { data, error } = await supabase
    .from(EXAM_TABLES.exams)
    .select("*")
    .eq("id", examId)
    .maybeSingle();
  if (error || !data) throw new Error("Exam tidak ditemukan.");
  return data as ExamRow;
}

export async function createExam(input: ExamInput): Promise<ExamRow> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from(EXAM_TABLES.exams)
    .insert({ ...input, created_by: userData.user?.id ?? null })
    .select("*")
    .single();
  if (error) throw new Error(translate(error.message, "Gagal membuat exam."));
  return data as ExamRow;
}

export async function updateExam(examId: string, input: Partial<ExamInput>): Promise<ExamRow> {
  const { data, error } = await supabase
    .from(EXAM_TABLES.exams)
    .update(input)
    .eq("id", examId)
    .select("*")
    .single();
  if (error) throw new Error(translate(error.message, "Gagal memperbarui exam."));
  return data as ExamRow;
}

export async function setExamStatus(examId: string, status: ExamStatus) {
  return updateExam(examId, { status });
}

export async function deleteExam(examId: string): Promise<void> {
  const { error } = await supabase.from(EXAM_TABLES.exams).delete().eq("id", examId);
  if (error) throw new Error("Gagal menghapus exam.");
}

// ---------- SECTION ----------

export async function listSections(examId: string): Promise<ExamSectionRow[]> {
  const { data, error } = await supabase
    .from(EXAM_TABLES.sections)
    .select("*")
    .eq("exam_id", examId)
    .order("order_index", { ascending: true });
  if (error) throw new Error("Gagal memuat section.");
  return (data as ExamSectionRow[] | null) ?? [];
}

export async function createSection(examId: string, input: SectionInput) {
  const existing = await listSections(examId);
  const { error } = await supabase.from(EXAM_TABLES.sections).insert({
    exam_id: examId,
    type: input.type,
    title: input.title,
    instruction: input.instruction || null,
    order_index: existing.length,
  });
  if (error) throw new Error("Gagal menambah section.");
}

export async function updateSection(sectionId: string, input: Partial<SectionInput>) {
  const { error } = await supabase
    .from(EXAM_TABLES.sections)
    .update({
      ...(input.type ? { type: input.type } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.instruction !== undefined ? { instruction: input.instruction || null } : {}),
    })
    .eq("id", sectionId);
  if (error) throw new Error("Gagal memperbarui section.");
}

export async function deleteSection(sectionId: string) {
  const { error } = await supabase.from(EXAM_TABLES.sections).delete().eq("id", sectionId);
  if (error) throw new Error("Gagal menghapus section.");
}

/** Simpan urutan section sesuai posisi array. */
export async function reorderSections(ids: string[]) {
  for (const [index, id] of ids.entries()) {
    const { error } = await supabase
      .from(EXAM_TABLES.sections)
      .update({ order_index: index })
      .eq("id", id);
    if (error) throw new Error("Gagal mengurutkan section.");
  }
}

// ---------- QUESTION ----------

export async function listQuestions(examId: string): Promise<ExamQuestionWithAnswers[]> {
  const { data, error } = await supabase
    .from(EXAM_TABLES.questions)
    .select("*")
    .eq("exam_id", examId)
    .order("order_index", { ascending: true });
  if (error) throw new Error("Gagal memuat soal.");

  const questions = (data as ExamQuestionRow[] | null) ?? [];
  if (questions.length === 0) return [];

  const { data: answerData, error: answerError } = await supabase
    .from(EXAM_TABLES.answers)
    .select("*")
    .in(
      "question_id",
      questions.map((q) => q.id),
    )
    .order("label", { ascending: true });
  if (answerError) throw new Error("Gagal memuat jawaban.");

  const answers = (answerData as ExamAnswerRow[] | null) ?? [];
  return questions.map((question) => ({
    ...question,
    answers: answers.filter((answer) => answer.question_id === question.id),
  }));
}

export async function createQuestion(
  examId: string,
  sectionId: string,
  input: QuestionInput,
): Promise<void> {
  const siblings = await listQuestions(examId);
  const orderIndex = siblings.filter((q) => q.section_id === sectionId).length;

  const { data, error } = await supabase
    .from(EXAM_TABLES.questions)
    .insert({
      exam_id: examId,
      section_id: sectionId,
      order_index: orderIndex,
      text: input.text,
      image_url: input.image_url,
      audio_url: input.audio_url,
      grammar_tag: input.grammar_tag || null,
      explanation: input.explanation || null,
      lesson_ref: input.lesson_ref || null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Gagal menyimpan soal.");

  const questionId = (data as { id: string }).id;
  const { error: answerError } = await supabase
    .from(EXAM_TABLES.answers)
    .insert(input.answers.map((answer) => ({ ...answer, question_id: questionId })));
  if (answerError) {
    // Rollback manual agar tidak menyisakan soal tanpa jawaban.
    await supabase.from(EXAM_TABLES.questions).delete().eq("id", questionId);
    throw new Error("Gagal menyimpan pilihan jawaban.");
  }
}

export async function updateQuestion(questionId: string, input: QuestionInput): Promise<void> {
  const { error } = await supabase
    .from(EXAM_TABLES.questions)
    .update({
      text: input.text,
      image_url: input.image_url,
      audio_url: input.audio_url,
      grammar_tag: input.grammar_tag || null,
      explanation: input.explanation || null,
      lesson_ref: input.lesson_ref || null,
    })
    .eq("id", questionId);
  if (error) throw new Error("Gagal memperbarui soal.");

  await supabase.from(EXAM_TABLES.answers).delete().eq("question_id", questionId);
  const { error: answerError } = await supabase
    .from(EXAM_TABLES.answers)
    .insert(input.answers.map((answer) => ({ ...answer, question_id: questionId })));
  if (answerError) throw new Error("Gagal memperbarui pilihan jawaban.");
}

export async function deleteQuestion(questionId: string) {
  const { error } = await supabase.from(EXAM_TABLES.questions).delete().eq("id", questionId);
  if (error) throw new Error("Gagal menghapus soal.");
}

/** Simpan urutan soal (drag & drop atau pindah nomor). */
export async function reorderQuestions(ids: string[]) {
  for (const [index, id] of ids.entries()) {
    const { error } = await supabase
      .from(EXAM_TABLES.questions)
      .update({ order_index: index })
      .eq("id", id);
    if (error) throw new Error("Gagal mengurutkan soal.");
  }
}

function translate(message: string, fallback: string) {
  if (message.includes("duplicate key") && message.includes("slug")) {
    return "Slug sudah dipakai exam lain.";
  }
  if (message.toLowerCase().includes("row-level security")) {
    return "Anda tidak memiliki izin untuk tindakan ini.";
  }
  return fallback;
}
