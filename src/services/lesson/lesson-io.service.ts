import type { LessonListItem } from "@/types/lesson";

/**
 * Placeholder Import/Export Lesson.
 * Sprint 9 hanya menyiapkan struktur service; implementasi menyusul.
 */

export type LessonIOFormat = "json";

export async function exportLessons(_rows: LessonListItem[], _format: LessonIOFormat = "json") {
  throw new Error("Fitur export belum tersedia.");
}

export async function importLessons(_file: File) {
  throw new Error("Fitur import belum tersedia.");
}
