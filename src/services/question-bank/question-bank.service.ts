import { supabase } from "@/lib/supabase/client";
import {
  QUESTION_TABLES,
  type GrammarTagRow,
  type LessonRow,
  type QuestionBankFilters,
  type QuestionBankInput,
  type QuestionBankResult,
  type QuestionBankRow,
} from "@/types/question-bank";

const SELECT_QUESTION = `*, answers:question_answers(*), tag_links:question_grammar_tags(tag:grammar_tags(*)), lesson:lessons(id,title,slug)`;

type RawQuestion = Omit<QuestionBankRow, "grammar_tags"> & {
  tag_links?: { tag: GrammarTagRow | null }[] | null;
};

function normalize(raw: RawQuestion): QuestionBankRow {
  const { tag_links, ...rest } = raw;
  return {
    ...rest,
    answers: (rest.answers ?? []).slice().sort((a, b) => a.label.localeCompare(b.label)),
    grammar_tags: (tag_links ?? []).map((l) => l.tag).filter(Boolean) as GrammarTagRow[],
  };
}

/** Daftar grammar tag (relasi, bukan string). */
export async function listGrammarTags(): Promise<GrammarTagRow[]> {
  const { data, error } = await supabase
    .from(QUESTION_TABLES.grammarTags)
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error("Gagal memuat grammar tag.");
  return (data as GrammarTagRow[] | null) ?? [];
}

/** Daftar lesson untuk referensi soal (foreign key). */
export async function listLessons(): Promise<LessonRow[]> {
  const { data, error } = await supabase
    .from(QUESTION_TABLES.lessons)
    .select("id,title,slug")
    .order("title", { ascending: true });
  if (error) return [];
  return (data as LessonRow[] | null) ?? [];
}

async function questionIdsByGrammar(slug: string): Promise<string[]> {
  const { data: tag } = await supabase
    .from(QUESTION_TABLES.grammarTags)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  const tagId = (tag as { id: string } | null)?.id;
  if (!tagId) return [];
  const { data } = await supabase
    .from(QUESTION_TABLES.questionGrammarTags)
    .select("question_id")
    .eq("tag_id", tagId);
  return ((data as { question_id: string }[] | null) ?? []).map((r) => r.question_id);
}

/** Daftar soal Question Bank dengan search, filter, dan pagination. */
export async function listBankQuestions({
  search = "",
  source = "semua",
  grammar = "semua",
  category = "semua",
  difficulty = "semua",
  media = "semua",
  page = 1,
  pageSize = 10,
}: QuestionBankFilters = {}): Promise<QuestionBankResult> {
  const from = (page - 1) * pageSize;
  let query = supabase
    .from(QUESTION_TABLES.questions)
    .select(SELECT_QUESTION, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1);

  const term = search.trim().replace(/[%,()]/g, "");
  if (term) query = query.or(`text.ilike.%${term}%,explanation.ilike.%${term}%`);
  if (source !== "semua") query = query.eq("source_type", source);
  if (category !== "semua") query = query.eq("category", category);
  if (difficulty !== "semua") query = query.eq("difficulty", difficulty);
  if (media === "image") query = query.not("image_url", "is", null);
  if (media === "audio") query = query.not("audio_url", "is", null);
  if (media === "none") query = query.is("image_url", null).is("audio_url", null);
  if (grammar !== "semua") {
    const ids = await questionIdsByGrammar(grammar);
    if (ids.length === 0) {
      return { rows: [], total: 0, page, pageSize, totalPages: 1 };
    }
    query = query.in("id", ids);
  }

  const { data, error, count } = await query;
  if (error) throw new Error("Gagal memuat Question Bank.");

  const total = count ?? 0;
  return {
    rows: ((data as RawQuestion[] | null) ?? []).map(normalize),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getBankQuestion(questionId: string): Promise<QuestionBankRow> {
  const { data, error } = await supabase
    .from(QUESTION_TABLES.questions)
    .select(SELECT_QUESTION)
    .eq("id", questionId)
    .maybeSingle();
  if (error || !data) throw new Error("Soal tidak ditemukan.");
  return normalize(data as RawQuestion);
}

async function syncRelations(questionId: string, input: QuestionBankInput) {
  await supabase.from(QUESTION_TABLES.answers).delete().eq("question_id", questionId);
  const { error: answerError } = await supabase
    .from(QUESTION_TABLES.answers)
    .insert(input.answers.map((a) => ({ ...a, text: a.text || null, question_id: questionId })));
  if (answerError) throw new Error("Gagal menyimpan pilihan jawaban.");

  await supabase.from(QUESTION_TABLES.questionGrammarTags).delete().eq("question_id", questionId);
  if (input.grammar_tag_ids.length > 0) {
    const { error: tagError } = await supabase
      .from(QUESTION_TABLES.questionGrammarTags)
      .insert(input.grammar_tag_ids.map((tag_id) => ({ question_id: questionId, tag_id })));
    if (tagError) throw new Error("Gagal menyimpan grammar tag.");
  }
}

/** Membuat soal baru di Question Bank (dipanggil dari Exam/Lesson Studio). */
export async function createBankQuestion(input: QuestionBankInput): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from(QUESTION_TABLES.questions)
    .insert({
      text: input.text,
      image_url: input.image_url,
      audio_url: input.audio_url,
      explanation: input.explanation || null,
      category: input.category,
      difficulty: input.difficulty,
      lesson_id: input.lesson_id,
      source_type: input.source_type,
      created_from: input.created_from,
      created_by: userData.user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Gagal menyimpan soal ke Question Bank.");

  const questionId = (data as { id: string }).id;
  try {
    await syncRelations(questionId, input);
  } catch (err) {
    await supabase.from(QUESTION_TABLES.questions).delete().eq("id", questionId);
    throw err;
  }
  return questionId;
}

export async function updateBankQuestion(
  questionId: string,
  input: QuestionBankInput,
): Promise<void> {
  const { error } = await supabase
    .from(QUESTION_TABLES.questions)
    .update({
      text: input.text,
      image_url: input.image_url,
      audio_url: input.audio_url,
      explanation: input.explanation || null,
      category: input.category,
      difficulty: input.difficulty,
      lesson_id: input.lesson_id,
    })
    .eq("id", questionId);
  if (error) throw new Error("Gagal memperbarui soal.");
  await syncRelations(questionId, input);
}

export async function deleteBankQuestion(questionId: string): Promise<void> {
  const { error } = await supabase.from(QUESTION_TABLES.questions).delete().eq("id", questionId);
  if (error) throw new Error("Gagal menghapus soal dari Question Bank.");
}

/** Catat statistik penggunaan soal (used_count & last_used_at). */
export async function markQuestionsUsed(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await supabase.rpc("touch_question_usage", { _ids: ids });
}
