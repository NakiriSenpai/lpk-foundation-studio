import type { QuestionBankRow } from "@/types/question-bank";

/**
 * Placeholder Import/Export Question Bank.
 * Sprint 7 hanya menyiapkan struktur service; implementasi menyusul.
 */

export type QuestionIOFormat = "json";

export async function exportQuestions(
  _rows: QuestionBankRow[],
  _format: QuestionIOFormat = "json",
) {
  throw new Error("Fitur export belum tersedia.");
}

export async function importQuestions(_file: File) {
  throw new Error("Fitur import belum tersedia.");
}
