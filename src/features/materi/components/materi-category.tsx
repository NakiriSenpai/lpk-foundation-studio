import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, PlayCircle, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EXAM_DIFFICULTY_LABELS } from "@/features/exam/exam.constants";
import {
  BookmarkButton,
  CategoryTile,
  FilterChip,
  ToneBar,
} from "@/features/materi/components/materi-primitives";
import { BOOKMARK_META, categoryMeta } from "@/features/materi/materi.constants";
import { useAuth } from "@/hooks/auth";
import {
  useLessonBookmarks,
  useLessonsWithProgress,
  useToggleLessonBookmark,
} from "@/hooks/lesson";
import { cn } from "@/lib/utils";
import type { ExamDifficulty } from "@/types/exam";

const LEVELS: Array<{ value: "semua" | ExamDifficulty; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "mudah", label: "Mudah" },
  { value: "sedang", label: "Sedang" },
  { value: "sulit", label: "Sulit" },
];

const STATUSES: Array<{ value: "semua" | "belum" | "selesai"; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "belum", label: "Belum" },
  { value: "selesai", label: "Selesai" },
];

/** Halaman kategori materi (referensi Gambar 2). */
export function MateriCategory({
  category,
  onBack,
  onOpen,
}: {
  category: string;
  onBack: () => void;
  onOpen: (lessonId: string) => void;
}) {
  const { profile } = useAuth();
  const isStudent = profile?.role === "siswa";
  const isBookmarkView = category === BOOKMARK_META.slug;
  const meta = categoryMeta(category);

  const [query, setQuery] = useState("");
  const [level, setLevel] = useState<"semua" | ExamDifficulty>("semua");
  const [status, setStatus] = useState<"semua" | "belum" | "selesai">("semua");

  const { data, isLoading, isError, refetch } = useLessonsWithProgress();
  const bookmarksQuery = useLessonBookmarks();
  const toggleBookmark = useToggleLessonBookmark();
  const bookmarks = useMemo(() => new Set(bookmarksQuery.data ?? []), [bookmarksQuery.data]);

  const scoped = useMemo(() => {
    const rows = data ?? [];
    return isBookmarkView ? rows.filter((l) => bookmarks.has(l.id)) : rows.filter((l) => l.category === category);
  }, [data, category, isBookmarkView, bookmarks]);

  const stats = useMemo(() => {
    const total = scoped.length;
    const completed = scoped.filter((l) => l.progress?.status === "completed").length;
    return { total, completed, percent: total === 0 ? 0 : Math.round((completed / total) * 100) };
  }, [scoped]);

  const lessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter((lesson) => {
      if (q && !`${lesson.title} ${lesson.description ?? ""}`.toLowerCase().includes(q)) return false;
      if (level !== "semua" && lesson.difficulty !== level) return false;
      if (status === "selesai" && lesson.progress?.status !== "completed") return false;
      if (status === "belum" && lesson.progress?.status === "completed") return false;
      return true;
    });
  }, [scoped, query, level, status]);

  const handleBookmark = (lessonId: string, next: boolean) => {
    toggleBookmark.mutate(
      { lessonId, bookmarked: next },
      {
        onSuccess: () => toast.success(next ? "Materi disimpan." : "Bookmark dihapus."),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Gagal menyimpan bookmark."),
      },
    );
  };

  return (
    <div className="space-y-5 pb-4">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
        <ArrowLeft className="mr-1 size-4" aria-hidden /> Kembali
      </Button>

      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <CategoryTile meta={meta} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-foreground">{meta.label}</h1>
          <p className="text-xs leading-relaxed text-muted-foreground">{meta.subtitle}</p>
        </div>
      </header>

      {isStudent ? (
        <section
          aria-label={`Progres ${meta.label}`}
          className={cn("space-y-3 rounded-3xl border border-border p-4 ring-1 ring-inset", meta.tone.soft, meta.tone.ring)}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <p className="truncate text-sm font-semibold text-foreground">Progres kategori</p>
            <p className={cn("shrink-0 text-sm font-bold", meta.tone.text)}>{stats.percent}%</p>
          </div>
          <ToneBar value={stats.percent} bar={meta.tone.bar} />
          <p className="text-xs text-muted-foreground">
            {stats.completed} dari {stats.total} materi selesai
          </p>
        </section>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={meta.searchPlaceholder}
            aria-label={meta.searchPlaceholder}
            className="h-11 pl-9"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Level</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {LEVELS.map((item) => (
              <FilterChip key={item.value} active={level === item.value} onClick={() => setLevel(item.value)}>
                {item.label}
              </FilterChip>
            ))}
          </div>
        </div>
        {isStudent ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Status</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {STATUSES.map((item) => (
                <FilterChip
                  key={item.value}
                  active={status === item.value}
                  onClick={() => setStatus(item.value)}
                >
                  {item.label}
                </FilterChip>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="space-y-3 p-6 text-center">
            <p className="text-sm text-foreground">Materi tidak dapat dimuat.</p>
            <Button onClick={() => void refetch()}>Coba lagi</Button>
          </CardContent>
        </Card>
      ) : lessons.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {isBookmarkView
              ? "Belum ada materi yang Anda simpan."
              : "Belum ada materi pada filter ini."}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {lessons.map((lesson) => {
            const lessonMeta = categoryMeta(lesson.category);
            const progress = lesson.progress;
            const done = progress?.status === "completed";
            return (
              <li key={lesson.id}>
                <div
                  className={cn(
                    "space-y-3 rounded-2xl border border-border bg-card p-4 ring-1 ring-inset",
                    lessonMeta.tone.ring,
                  )}
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                    <CategoryTile meta={lessonMeta} size="sm" />
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold text-foreground">{lesson.title}</p>
                      {lesson.description ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {lesson.description}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <Badge variant="outline" className="text-[11px]">
                          {EXAM_DIFFICULTY_LABELS[lesson.difficulty]}
                        </Badge>
                        {isStudent && done ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                            <CheckCircle2 className="size-3.5" aria-hidden /> Selesai
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {isStudent ? (
                      <BookmarkButton
                        active={bookmarks.has(lesson.id)}
                        disabled={toggleBookmark.isPending}
                        label={lesson.title}
                        onToggle={() => handleBookmark(lesson.id, !bookmarks.has(lesson.id))}
                      />
                    ) : null}
                  </div>

                  {isStudent && progress && !done ? (
                    <div className="space-y-1.5">
                      <ToneBar value={progress.progress_percent} bar={lessonMeta.tone.bar} />
                      <p className="text-xs text-muted-foreground">
                        {progress.progress_percent}% selesai
                      </p>
                    </div>
                  ) : null}

                  <Button className="h-11 w-full" onClick={() => onOpen(lesson.id)}>
                    <PlayCircle className="mr-2 size-4" aria-hidden />
                    {done ? "Pelajari Lagi" : progress ? "Lanjutkan" : "Mulai"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
