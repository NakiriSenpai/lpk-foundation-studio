import type { ExamRow } from "@/types/exam";

/**
 * Placeholder Import/Export Exam.
 * Sprint 6 hanya menyiapkan struktur service dan menu; implementasi menyusul.
 */

export type ExamExportFormat = "json" | "xlsx";

export async function exportExam(_exam: ExamRow, _format: ExamExportFormat = "json") {
  throw new Error("Fitur export belum tersedia.");
}

export async function importExam(_file: File) {
  throw new Error("Fitur import belum tersedia.");
}
