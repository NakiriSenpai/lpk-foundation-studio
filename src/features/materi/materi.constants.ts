import {
  Bookmark,
  Headphones,
  Landmark,
  ListTree,
  MessagesSquare,
  Type,
  type LucideIcon,
} from "lucide-react";

import { LESSON_CATEGORIES } from "@/features/lesson/lesson.constants";

/**
 * Sprint 16 — Taksonomi visual kategori materi.
 * Slug kategori = identifier database (LESSON_CATEGORIES). Tidak ada taksonomi kedua.
 */
export type CategoryTone = {
  /** Tile ikon (gradien solid sesuai warna kategori). */
  tile: string;
  /** Teks beraksen kategori. */
  text: string;
  /** Isi progress bar. */
  bar: string;
  /** Border/ring lembut. */
  ring: string;
  /** Latar lembut. */
  soft: string;
};

export type CategoryMeta = {
  slug: string;
  label: string;
  subtitle: string;
  listDescription: string;
  searchPlaceholder: string;
  icon: LucideIcon;
  tone: CategoryTone;
};

function tone(color: string): CategoryTone {
  return {
    tile: `bg-gradient-to-br from-${color} to-${color}/70 text-background`,
    text: `text-${color}`,
    bar: `bg-${color}`,
    ring: `ring-${color}/25`,
    soft: `bg-${color}/12`,
  };
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  "tata-bahasa": {
    slug: "tata-bahasa",
    label: "Tata Bahasa",
    subtitle: "Pola kalimat dan aturan bahasa Korea",
    listDescription: "Pola kalimat & rumus",
    searchPlaceholder: "Cari tata bahasa",
    icon: ListTree,
    tone: tone("cat-grammar"),
  },
  kosakata: {
    slug: "kosakata",
    label: "Kosakata",
    subtitle: "Perbendaharaan kata untuk kebutuhan harian",
    listDescription: "Kosakata harian",
    searchPlaceholder: "Cari kosakata",
    icon: Type,
    tone: tone("cat-vocab"),
  },
  budaya: {
    slug: "budaya",
    label: "Budaya",
    subtitle: "Budaya kerja dan etika di Korea",
    listDescription: "Budaya & etika",
    searchPlaceholder: "Cari budaya",
    icon: Landmark,
    tone: tone("cat-culture"),
  },
  conversation: {
    slug: "conversation",
    label: "Percakapan",
    subtitle: "Dialog dan ungkapan sehari-hari",
    listDescription: "Dialog sehari-hari",
    searchPlaceholder: "Cari percakapan",
    icon: MessagesSquare,
    tone: tone("cat-conversation"),
  },
  listening: {
    slug: "listening",
    label: "Listening",
    subtitle: "Latihan menyimak beserta transkrip",
    listDescription: "Audio & transkrip",
    searchPlaceholder: "Cari listening",
    icon: Headphones,
    tone: tone("cat-listening"),
  },
};

export const BOOKMARK_META: CategoryMeta = {
  slug: "bookmark",
  label: "Bookmark",
  subtitle: "Materi yang Anda simpan",
  listDescription: "Materi tersimpan",
  searchPlaceholder: "Cari materi tersimpan",
  icon: Bookmark,
  tone: tone("cat-bookmark"),
};

const FALLBACK: CategoryMeta = {
  slug: "umum",
  label: "Materi",
  subtitle: "Materi pembelajaran",
  listDescription: "Materi lainnya",
  searchPlaceholder: "Cari materi",
  icon: ListTree,
  tone: tone("primary"),
};

export const CATEGORY_ORDER: string[] = [...LESSON_CATEGORIES];

export function categoryMeta(slug: string): CategoryMeta {
  if (slug === BOOKMARK_META.slug) return BOOKMARK_META;
  return CATEGORY_META[slug] ?? { ...FALLBACK, slug, label: slug };
}
