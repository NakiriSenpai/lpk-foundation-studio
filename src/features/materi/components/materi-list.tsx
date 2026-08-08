import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Loader2, PlayCircle, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EXAM_DIFFICULTY_LABELS } from "@/features/exam/exam.constants";
import { LESSON_CATEGORIES, lessonCategoryLabel } from "@/features/lesson/lesson.constants";
import { useAuth } from "@/hooks/auth";
import { useLessonsWithProgress } from "@/hooks/lesson";
import { cn } from "@/lib/utils";
import type { LessonWithProgress } from "@/types/lesson";

function ctaLabel(lesson: LessonWithProgress) {
  const status = lesson.progress?.status;
  if (status === "completed") return "Pelajari Lagi";
  if (status === "in_progress") return "Lanjutkan";
  return "Mulai";
}

function CtaIcon({ lesson }: { lesson: LessonWithProgress }) {
  const status = lesson.progress?.status;
  if (status === "completed") return <RotateCcw className="mr-2 size-4" aria-hidden />;
  if (status === "in_progress") return <PlayCircle className="mr-2 size-4" aria-hidden />;
  return <BookOpen className="mr-2 size-4" aria-hidden />;
}

function StatusLine({ lesson }: { lesson: LessonWithProgress }) {
  const progress = lesson.progress;
  if (!progress) return <p className="text-xs text-muted-foreground">Belum dimulai</p>;
  if (progress.status === "completed") {
    return (
      <p className="flex items-center gap-1 text-xs font-medium text-primary">
        <CheckCircle2 className="size-3.5" aria-hidden /> Selesai
      </p>
    );
  }
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{progress.progress_percent}% selesai</p>
      <Progress value={progress.progress_percent} className="h-1.5" />
    </div>
  );
}

/** Daftar materi terbit + status progres siswa (Sprint 16). */
export function MateriList({ onOpen }: { onOpen: (lessonId: string) => void }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isStudent = profile?.role === "siswa";
  const [category, setCategory] = useState<string>("semua");

  const { data, isLoading, isError, refetch } = useLessonsWithProgress();

  const lessons = useMemo(() => {
    const rows = data ?? [];
    return category === "semua" ? rows : rows.filter((l) => l.category === category);
  }, [data, category]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden /> Memuat materi…
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="text-sm text-foreground">Materi tidak dapat dimuat.</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => void refetch()}>Coba lagi</Button>
            <Button variant="outline" onClick={() => void navigate({ to: "/dashboard" })}>
              Kembali ke dasbor
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Materi</h1>
        <p className="text-sm text-muted-foreground">
          Materi pembelajaran yang sudah dipublikasikan.
        </p>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {(["semua", ...LESSON_CATEGORIES] as string[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={cn(
              "min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-medium transition-colors",
              category === item
                ? "border-primary bg-primary/15 text-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50",
            )}
          >
            {item === "semua" ? "Semua" : lessonCategoryLabel(item)}
          </button>
        ))}
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {category === "semua"
              ? "Belum ada materi tersedia."
              : "Belum ada materi pada kategori ini."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardContent className="space-y-3 p-4">
                {lesson.thumbnail_url ? (
                  <img
                    src={lesson.thumbnail_url}
                    alt={`Sampul ${lesson.title}`}
                    loading="lazy"
                    className="max-h-40 w-full rounded-lg object-cover"
                  />
                ) : null}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {lessonCategoryLabel(lesson.category)}
                  </p>
                  <h2 className="text-base font-semibold text-foreground">{lesson.title}</h2>
                  {lesson.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {lesson.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">{EXAM_DIFFICULTY_LABELS[lesson.difficulty]}</Badge>
                </div>
                {isStudent ? <StatusLine lesson={lesson} /> : null}
                <Button className="h-11 w-full" onClick={() => onOpen(lesson.id)}>
                  <CtaIcon lesson={lesson} />
                  {isStudent ? ctaLabel(lesson) : "Buka Materi"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
