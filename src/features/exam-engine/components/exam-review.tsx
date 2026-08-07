import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, CircleSlash, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAttemptReview } from "@/hooks/attempt";
import { listLessonTitles } from "@/services/lesson";
import { cn } from "@/lib/utils";
import type { AnswerLabel } from "@/types/exam";
import { SimpleAudio } from "./simple-audio";

/**
 * Review Ujian — SELALU membaca Snapshot beku milik attempt.
 * Tidak membaca Exam Studio / Question Bank / Lesson Studio,
 * sehingga perubahan soal setelah ujian tidak mengubah review.
 * Audio pada review bebas diputar (tanpa Audio Lock).
 */
export function ExamReview({ attemptId }: { attemptId: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useAttemptReview(attemptId);
  const lessonIds = (data?.snapshot.questions ?? [])
    .map((q) => q.lesson_id)
    .filter((id): id is string => Boolean(id));
  const { data: lessonTitles } = useQuery({
    queryKey: ["lesson-titles", lessonIds.slice().sort().join(",")],
    queryFn: () => listLessonTitles(lessonIds),
    enabled: lessonIds.length > 0,
    staleTime: 300_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Memuat review ujian…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="font-medium text-foreground">
            {error instanceof Error ? error.message : "Review ujian tidak dapat dimuat."}
          </p>
          <Button onClick={() => void navigate({ to: "/ujian" })}>Kembali ke daftar ujian</Button>
        </CardContent>
      </Card>
    );
  }

  const { snapshot, answers } = data;
  const selectedByQuestion = new Map<string, AnswerLabel | null>(
    answers.map((row) => [row.question_id, row.selected_label]),
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">
            Review — {snapshot.exam.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {snapshot.questions.length} soal · Isi review diambil dari snapshot saat ujian dimulai.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void navigate({ to: "/ujian/hasil/$attemptId", params: { attemptId } })}
        >
          <ArrowLeft className="mr-1.5 size-4" /> Hasil
        </Button>
      </div>

      {snapshot.questions.map((question, index) => {
        const selected = selectedByQuestion.get(question.question_id) ?? null;
        const correct = question.correct_label ?? null;
        const status = selected === null ? "kosong" : selected === correct ? "benar" : "salah";
        const section = snapshot.sections.find((s) => s.section_id === question.section_id);

        return (
          <Card key={question.question_id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="outline">Soal {index + 1}</Badge>
                <Badge
                  variant={
                    status === "benar"
                      ? "default"
                      : status === "salah"
                        ? "destructive"
                        : "secondary"
                  }
                  className="gap-1.5"
                >
                  {status === "benar" ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : status === "salah" ? (
                    <XCircle className="size-3.5" />
                  ) : (
                    <CircleSlash className="size-3.5" />
                  )}
                  {status === "benar" ? "Benar" : status === "salah" ? "Salah" : "Tidak dijawab"}
                </Badge>
              </div>

              {section ? (
                <p className="text-xs text-muted-foreground">
                  {section.title}
                  {section.instruction ? ` — ${section.instruction}` : ""}
                </p>
              ) : null}

              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
                {question.text}
              </p>

              {question.image_url ? (
                <img
                  src={question.image_url}
                  alt={`Gambar soal nomor ${index + 1}`}
                  loading="lazy"
                  className="mx-auto max-h-52 w-auto max-w-full rounded-xl border border-border object-contain sm:max-h-64"
                />
              ) : null}

              {question.audio_url ? (
                <div className="space-y-1">
                  {/* Review: audio bebas diputar, hanya tombol Play/Pause. */}
                  <SimpleAudio src={question.audio_url} label="Putar audio soal" />
                  <p className="text-xs text-muted-foreground">
                    Audio dapat diputar ulang tanpa batas pada review.
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                {question.answers.map((answer, answerIndex) => {
                  const isCorrect = answer.label === correct;
                  const isChosen = answer.label === selected;
                  return (
                    <div
                      key={answer.label}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3 text-left",
                        isCorrect
                          ? "border-emerald-500 bg-emerald-500/10"
                          : isChosen
                            ? "border-destructive bg-destructive/10"
                            : "border-border",
                      )}
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-sm font-semibold">
                        {answerIndex + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        {answer.text ? (
                          <p className="whitespace-pre-wrap text-sm text-foreground">
                            {answer.text}
                          </p>
                        ) : null}
                        {answer.image_url ? (
                          <img
                            src={answer.image_url}
                            alt={`Pilihan ${answerIndex + 1}`}
                            loading="lazy"
                            className="max-h-28 w-auto max-w-full rounded-lg border border-border object-contain sm:max-h-36"
                          />
                        ) : null}
                        {answer.audio_url ? (
                          <SimpleAudio
                            src={answer.audio_url}
                            label={`Audio pilihan ${answerIndex + 1}`}
                          />
                        ) : null}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {isChosen ? <Badge variant="outline">Jawaban Anda</Badge> : null}
                          {isCorrect ? <Badge variant="outline">Jawaban Benar</Badge> : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Pembahasan
                  </p>
                  <p className="whitespace-pre-wrap text-foreground">
                    {question.explanation?.trim() ? question.explanation : "Belum ada pembahasan."}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Grammar Tag
                  </p>
                  {question.grammar_tags.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {question.grammar_tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Belum dihubungkan.</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Materi Terkait
                  </p>
                  {question.lesson_id ? (
                    <p className="text-foreground">
                      {lessonTitles?.[question.lesson_id] ?? "Memuat judul materi…"}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Belum dihubungkan.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Button variant="outline" className="w-full" onClick={() => void navigate({ to: "/ujian" })}>
        Keluar
      </Button>
    </div>
  );
}
