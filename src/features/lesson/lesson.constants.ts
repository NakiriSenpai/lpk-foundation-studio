import type { LessonBlockType, LessonStatus } from "@/types/lesson";

export const LESSON_STATUS_LABELS: Record<LessonStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const LESSON_BLOCK_LABELS: Record<LessonBlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  bullet_list: "Bullet List",
  image: "Image",
  audio: "Audio",
  callout: "Callout",
  divider: "Divider",
  grammar_highlight: "Grammar Highlight",
};

export const LESSON_BLOCK_TYPES: LessonBlockType[] = [
  "heading",
  "paragraph",
  "bullet_list",
  "image",
  "audio",
  "callout",
  "divider",
  "grammar_highlight",
];

/** Block yang memerlukan teks isi. */
export const BLOCK_NEEDS_TEXT: LessonBlockType[] = [
  "heading",
  "paragraph",
  "callout",
  "grammar_highlight",
];

export function blockPreview(type: LessonBlockType, content: string | null, items: string[]) {
  if (type === "divider") return "———";
  if (type === "bullet_list") return items.join(" · ") || "(daftar kosong)";
  return content?.trim() || "(kosong)";
}
