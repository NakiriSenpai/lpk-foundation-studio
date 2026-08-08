import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, PlayCircle, Search } from "lucide-react";

import progressIllustration from "@/assets/progress-illustration.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/auth";
import { useLessonsWithProgress } from "@/hooks/lesson";
import {
  BOOKMARK_META,
  CATEGORY_ORDER,
  categoryMeta,
} from "@/features/materi/materi.constants";
import {
  CategoryRow,
  CategoryTile,
  ToneBar,
} from "@/features/materi/components/materi-primitives";
import { cn } from "@/lib/utils";
import type { LessonWithProgress } from "@/types/lesson";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Halaman utama Materi (referensi Gambar 1). */
export function MateriHome() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isStudent = profile?.role === "siswa";
  const [query, setQuery] = useState("");

  const { data, isLoading, isError, refetch } = useLessonsWithProgress();
  const lessons = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const total = lessons.length;
    const completed = lessons.filter((l) => l.progress?.status === "completed").length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percent };
  }, [lessons]);

  const perCategory = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; percent: number }>();
    for (const slug of CATEGORY_ORDER) map.set(slug, { total: 0, completed: 0, percent: 0 });
    for (const lesson of lessons) {
      const entry = map.get(lesson.category) ?? { total: 0, completed: 0, percent: 0 };
      entry.total += 1;
      if (lesson.progress?.status === "completed") entry.completed += 1;
      map.set(lesson.category, entry);
    }
    for (const entry of map.values()) {
      entry.percent = entry.total === 0 ? 0 : Math.round((entry.completed / entry.total) * 100);
    }
    return map;
  }, [lessons]);

  const resume: LessonWithProgress | undefined = useMemo(
    () =>
      lessons
        .filter((l) => l.progress?.status === "in_progress")
        .sort((a, b) =>
          (b.progress?.last_activity_at ?? "").localeCompare(a.progress?.last_activity_at ?? ""),
        )[0],
    [lessons],
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return lessons.filter(
      (l) =>
        l.title.toLowerCase().includes(q) || (l.description ?? "").toLowerCase().includes(q),
    );
  }, [lessons, query]);

  const openLesson = (lessonId: string) =>
    void navigate({ to: "/materi/lesson/$lessonId", params: { lessonId } });
  const openCategory = (category: string) =>
    void navigate({ to: "/materi/$category", params: { category } });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="text-sm text-foreground">Materi tidak dapat dimuat.</p>
          <Button onClick={() => void refetch()}>Coba lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      <header className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-background">
          <BookOpen className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-foreground">Materi</h1>
          <p className="truncate text-xs text-muted-foreground">
            Belajar terstruktur per kategori
          </p>
        </div>
      </header>

      {isStudent ? (
        <section
          aria-label="Progress belajar"
          className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/25 via-card to-card p-5"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-semibold text-foreground">Progress kamu</p>
              <p className="text-xs text-muted-foreground">Total pembelajaran selesai</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {pad(stats.completed)}
                <span className="text-base font-medium text-muted-foreground">
                  {" "}
                  / {pad(stats.total)}
                </span>
              </p>
            </div>
            <img
              src={progressIllustration}
              alt=""
              aria-hidden
              loading="lazy"
              width={640}
              height={640}
              className="size-24 shrink-0 object-contain"
            />
          </div>
          <div className="mt-3 space-y-1.5">
            <ToneBar value={stats.percent} bar="bg-primary" />
            <p className="text-right text-xs text-muted-foreground">{stats.percent}% selesai</p>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Kategori</h2>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORY_ORDER.map((slug, index) => {
            const meta = categoryMeta(slug);
            const entry = perCategory.get(slug) ?? { total: 0, completed: 0, percent: 0 };
            const isLastOdd = index === CATEGORY_ORDER.length - 1 && CATEGORY_ORDER.length % 2 === 1;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => openCategory(slug)}
                className={cn(
                  "space-y-3 rounded-2xl border border-border bg-card p-4 text-left ring-1 ring-inset transition-colors hover:border-primary/50",
                  meta.tone.ring,
                  isLastOdd && "col-span-2",
                )}
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                  <CategoryTile meta={meta} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {meta.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {entry.total} materi
                    </span>
                  </span>
                </div>
                {isStudent ? (
                  <div className="space-y-1.5">
                    <ToneBar value={entry.percent} bar={meta.tone.bar} />
                    <span className={cn("block text-xs font-medium", meta.tone.text)}>
                      {entry.percent}% selesai
                    </span>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      {isStudent && resume ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Lanjutkan materi</h2>
          <Card className={cn("ring-1 ring-inset", categoryMeta(resume.category).tone.ring)}>
            <CardContent className="space-y-3 p-4">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <CategoryTile meta={categoryMeta(resume.category)} />
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-xs font-semibold uppercase tracking-wide",
                      categoryMeta(resume.category).tone.text,
                    )}
                  >
                    {categoryMeta(resume.category).label}
                  </p>
                  <p className="truncate text-sm font-medium text-foreground">{resume.title}</p>
                </div>
              </div>
              <ToneBar
                value={resume.progress?.progress_percent ?? 0}
                bar={categoryMeta(resume.category).tone.bar}
              />
              <Button className="h-11 w-full" onClick={() => openLesson(resume.id)}>
                <PlayCircle className="mr-2 size-4" aria-hidden /> Lanjutkan (
                {resume.progress?.progress_percent ?? 0}%)
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h2 className="truncate text-sm font-semibold text-foreground">Daftar materi</h2>
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari materi"
            aria-label="Cari materi"
            className="h-11 pl-9"
          />
        </div>

        {query.trim() ? (
          searchResults.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Materi tidak ditemukan.
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {searchResults.map((lesson) => {
                const meta = categoryMeta(lesson.category);
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => openLesson(lesson.id)}
                      className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50"
                    >
                      <CategoryTile meta={meta} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {lesson.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {meta.label}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )
        ) : (
          <div className="space-y-2">
            {CATEGORY_ORDER.map((slug) => {
              const meta = categoryMeta(slug);
              const entry = perCategory.get(slug) ?? { total: 0, completed: 0, percent: 0 };
              return (
                <CategoryRow
                  key={slug}
                  meta={meta}
                  caption={`${meta.listDescription} • ${entry.total} materi`}
                  onClick={() => openCategory(slug)}
                />
              );
            })}
            {isStudent ? (
              <CategoryRow
                meta={BOOKMARK_META}
                caption={BOOKMARK_META.listDescription}
                onClick={() => openCategory(BOOKMARK_META.slug)}
              />
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
