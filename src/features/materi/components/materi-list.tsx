import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORY_LABELS, EXAM_DIFFICULTY_LABELS } from "@/features/exam/exam.constants";
import { listPublishedLessons } from "@/services/lesson";

/** Daftar materi (lesson) berstatus Published untuk siswa (BUG 18). */
export function MateriList({ onOpen }: { onOpen: (lessonId: string) => void }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["published-lessons"],
    queryFn: listPublishedLessons,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Memuat materi…
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="text-sm text-foreground">Materi tidak dapat dimuat.</p>
          <Button variant="outline" onClick={() => void navigate({ to: "/dashboard" })}>
            Kembali ke dasbor
          </Button>
        </CardContent>
      </Card>
    );
  }

  const lessons = data ?? [];

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Materi</h1>
        <p className="text-sm text-muted-foreground">
          Materi pembelajaran yang sudah dipublikasikan.
        </p>
      </header>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Belum ada materi yang dipublikasikan.
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
                  <h2 className="text-base font-semibold text-foreground">{lesson.title}</h2>
                  {lesson.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {lesson.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">
                    {CATEGORY_LABELS[lesson.category] ?? lesson.category}
                  </Badge>
                  <Badge variant="outline">{EXAM_DIFFICULTY_LABELS[lesson.difficulty]}</Badge>
                </div>
                <Button className="h-11 w-full" onClick={() => onOpen(lesson.id)}>
                  <BookOpen className="mr-2 size-4" /> Buka Materi
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
