import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  LayoutGrid,
  Loader2,
  RectangleHorizontal,
  RectangleVertical,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAttemptReview } from "@/hooks/attempt";
import { listLessonTitles } from "@/services/lesson";
import { cn } from "@/lib/utils";
import type { AnswerLabel } from "@/types/exam";
import { OpenLessonDialog } from "./open-lesson-dialog";
import { QuestionPalette, type PaletteGroup, type PaletteItem } from "./question-palette";
import { SimpleAudio } from "./simple-audio";
import { useExamLayout } from "../hooks/use-exam-layout";

/**
 * Review Ujian — SELALU membaca Snapshot beku milik attempt.
 * Sprint 10E: memakai tata letak yang sama dengan halaman ujian
 * (satu soal per layar, daftar soal lewat popup, pembahasan di bawah).
 */
export function ExamReview({ attemptId }: { attemptId: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useAttemptReview(attemptId);
  const { isLandscape, setLayout } = useExamLayout(attemptId);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [lessonDialog, setLessonDialog] = useState<{ id: string; title: string } | null>(null);

  const questions = useMemo(() => data?.snapshot.questions ?? [], [data]);
  const lessonIds = questions.map((q) => q.lesson_id).filter((id): id is string => Boolean(id));
  const { data: lessonTitles } = useQuery({
    queryKey: ["lesson-titles", lessonIds.slice().sort().join(",")],
    queryFn: () => listLessonTitles(lessonIds),
    enabled: lessonIds.length > 0,
    staleTime: 300_000,
  });

  const selectedByQuestion = useMemo(
    () =>
      new Map<string, AnswerLabel | null>(
        (data?.answers ?? []).map((row) => [row.question_id, row.selected_label]),
      ),
    [data],
  );

  const paletteGroups: PaletteGroup[] = useMemo(() => {
    if (!data) return [];
    const items: PaletteItem[] = questions.map((q, index) => ({
      questionId: q.question_id,
      index,
      answered: Boolean(selectedByQuestion.get(q.question_id)),
      flagged: false,
    }));
    const groups: PaletteGroup[] = [];
    for (const s of data.snapshot.sections) {
      const own = items.filter((p) => questions[p.index]?.section_id === s.section_id);
      if (own.length > 0) groups.push({ id: s.section_id, title: s.title, items: own });
    }
    const grouped = new Set(groups.flatMap((g) => g.items.map((i) => i.questionId)));
    const rest = items.filter((p) => !grouped.has(p.questionId));
    if (rest.length > 0) groups.push({ id: "lainnya", title: "Lainnya", items: rest });
    return groups;
  }, [data, questions, selectedByQuestion]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Memuat review ujian…
      </div>
    );
  }

  if (isError || !data || questions.length === 0) {
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

  const { snapshot } = data;
  const index = Math.min(activeIndex, questions.length - 1);
  const question = questions[index]!;
  const selected = selectedByQuestion.get(question.question_id) ?? null;
  const correct = question.correct_label ?? null;
  const status = selected === null ? "kosong" : selected === correct ? "benar" : "salah";
  const section = snapshot.sections.find((s) => s.section_id === question.section_id);
  const lessonTitle = question.lesson_id
    ? (lessonTitles?.[question.lesson_id] ?? "Materi terkait")
    : null;

  const openLesson = () => {
    if (!lessonDialog) return;
    const lessonId = lessonDialog.id;
    setLessonDialog(null);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    void navigate({ to: "/materi", search: { lesson: lessonId } });
  };

  const paletteButton = (
    <Button type="button" size="sm" variant="outline" onClick={() => setPaletteOpen(true)}>
      <LayoutGrid className="mr-1.5 size-4" /> Daftar Soal
    </Button>
  );

  const explanation = (
    <Card>
      <CardContent className="space-y-3 p-4 text-sm">
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
          {question.lesson_id && lessonTitle ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-1"
              onClick={() =>
                setLessonDialog({ id: question.lesson_id as string, title: lessonTitle })
              }
            >
              <BookOpen className="mr-1.5 size-4" />
              {lessonTitle}
            </Button>
          ) : (
            <p className="text-muted-foreground">Belum dihubungkan.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* Toolbar: posisi tombol sama seperti halaman ujian (kanan atas). */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">
            Review — {snapshot.exam.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {questions.length} soal · Diambil dari snapshot saat ujian dimulai.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-9"
            aria-label={
              isLandscape ? "Ubah ke tata letak portrait" : "Ubah ke tata letak landscape"
            }
            onClick={() => setLayout(isLandscape ? "portrait" : "landscape")}
          >
            {isLandscape ? (
              <RectangleVertical className="size-4" />
            ) : (
              <RectangleHorizontal className="size-4" />
            )}
          </Button>
          {paletteButton}
          <Button
            size="sm"
            variant="outline"
            onClick={() => void navigate({ to: "/ujian/hasil/$attemptId", params: { attemptId } })}
          >
            <ArrowLeft className="mr-1.5 size-4" /> Hasil
          </Button>
        </div>
      </div>

      <div className={cn("grid gap-4", isLandscape && "grid-cols-[1.2fr_1fr] items-start")}>
        {/* Kiri (landscape) / atas (portrait): soal */}
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline">
                Soal {index + 1} dari {questions.length}
              </Badge>
              <Badge
                variant={
                  status === "benar" ? "default" : status === "salah" ? "destructive" : "secondary"
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
                <SimpleAudio src={question.audio_url} label="Putar audio soal" />
                <p className="text-xs text-muted-foreground">
                  Audio dapat diputar ulang tanpa batas pada review.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Kanan (landscape) / bawah (portrait): jawaban + navigasi */}
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-2 p-4">
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
                        <p className="whitespace-pre-wrap text-sm text-foreground">{answer.text}</p>
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
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              disabled={index === 0}
              onClick={() => setActiveIndex(Math.max(0, index - 1))}
            >
              <ChevronLeft className="mr-1 size-4" /> Sebelumnya
            </Button>
            <Button
              type="button"
              className="h-11 flex-1"
              disabled={index >= questions.length - 1}
              onClick={() => setActiveIndex(Math.min(questions.length - 1, index + 1))}
            >
              Berikutnya <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Pembahasan selalu di bagian bawah (portrait & landscape). */}
      {explanation}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
          void navigate({ to: "/ujian" });
        }}
      >
        Keluar
      </Button>

      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daftar Soal</DialogTitle>
            <DialogDescription>Pilih nomor soal untuk berpindah.</DialogDescription>
          </DialogHeader>
          <Separator />
          <QuestionPalette
            groups={paletteGroups}
            activeIndex={index}
            disabled={false}
            onJump={(next) => {
              setActiveIndex(next);
              setPaletteOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <OpenLessonDialog
        open={Boolean(lessonDialog)}
        lessonTitle={lessonDialog?.title ?? ""}
        onOpenChange={(open) => {
          if (!open) setLessonDialog(null);
        }}
        onConfirm={openLesson}
      />
    </div>
  );
}
