import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Flag,
  Loader2,
  Maximize,
  RectangleHorizontal,
  RectangleVertical,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useAttemptSession,
  useRecordViolation,
  useSaveAnswer,
  useSetFlag,
  useSubmitAttempt,
} from "@/hooks/attempt";
import { cn } from "@/lib/utils";
import type { AnswerLabel } from "@/types/exam";
import type { AttemptAnswerRow } from "@/types/attempt";
import { ATTEMPT_STATUS_LABELS } from "@/types/attempt";
import { SubmitExamDialog } from "./exam-dialogs";
import { LockedAudio } from "./locked-audio";
import { SimpleAudio } from "./simple-audio";
import { QuestionPalette, type PaletteGroup, type PaletteItem } from "./question-palette";
import { useExamTimer } from "../hooks/use-exam-timer";
import { useFullscreenGuard } from "../hooks/use-fullscreen-guard";

type LocalAnswer = { label: AnswerLabel | null; flagged: boolean };
type LayoutMode = "portrait" | "landscape";

export function ExamRunner({ attemptId }: { attemptId: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useAttemptSession(attemptId);
  const saveAnswer = useSaveAnswer();
  const setFlagMutation = useSetFlag();
  const recordViolation = useRecordViolation();
  const submit = useSubmitAttempt();

  const [activeIndex, setActiveIndex] = useState(0);
  const [local, setLocal] = useState<Record<string, LocalAnswer>>({});
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [violations, setViolations] = useState(0);
  const [layout, setLayout] = useState<LayoutMode>("portrait");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  /** Guard dimatikan begitu proses submit dimulai (BUG 5). */
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const attempt = data?.attempt;
  const snapshot = data?.snapshot;
  const isRunning = attempt?.status === "in_progress";
  const limit = attempt?.fullscreen_limit ?? 4;

  // Pulihkan jawaban tersimpan setelah refresh.
  useEffect(() => {
    if (!data) return;
    const restored: Record<string, LocalAnswer> = {};
    for (const row of data.answers as AttemptAnswerRow[]) {
      restored[row.question_id] = { label: row.selected_label, flagged: row.is_flagged };
    }
    setLocal(restored);
    setViolations(data.attempt.fullscreen_violations);
  }, [data]);

  const finish = useCallback(
    async (reason: "manual" | "time_up" | "fullscreen_violation") => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setConfirmSubmit(false);
      try {
        await submit.mutateAsync({ attemptId, reason });
        if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
        toast.success(
          reason === "time_up"
            ? "Waktu habis. Ujian dikumpulkan otomatis."
            : reason === "fullscreen_violation"
              ? "Batas pelanggaran layar penuh tercapai. Ujian dikumpulkan otomatis."
              : "Ujian berhasil dikumpulkan.",
        );
        void navigate({ to: "/ujian/hasil/$attemptId", params: { attemptId } });
      } catch (submitError) {
        submittingRef.current = false;
        setSubmitting(false);
        toast.error(
          submitError instanceof Error ? submitError.message : "Gagal mengumpulkan ujian.",
        );
      }
    },
    [attemptId, navigate, submit],
  );

  const {
    label: timerLabel,
    remaining,
    isReady: timerReady,
  } = useExamTimer(attempt?.expires_at, Boolean(isRunning), attempt?.started_at);

  // AUTO SUBMIT: hanya jika timer valid, sudah siap, dan benar-benar habis.
  useEffect(() => {
    if (isRunning && timerReady && remaining <= 0) void finish("time_up");
  }, [isRunning, timerReady, remaining, finish]);

  const handleViolation = useCallback(() => {
    if (!isRunning || submittingRef.current) return;
    void recordViolation.mutateAsync(attemptId).then((count) => {
      if (submittingRef.current) return;
      setViolations(count);
      if (count >= limit) {
        void finish("fullscreen_violation");
      } else {
        toast.warning(`Anda keluar dari layar penuh (${count}/${limit}). Kembali sekarang.`);
      }
    });
  }, [attemptId, finish, isRunning, limit, recordViolation]);

  const { isFullscreen, isArmed, isUnsupported, requestFullscreen } = useFullscreenGuard({
    enabled: Boolean(isRunning) && !submitting,
    onViolation: handleViolation,
  });

  const questions = useMemo(() => snapshot?.questions ?? [], [snapshot]);
  const current = questions[activeIndex];
  const section = snapshot?.sections.find((s) => s.section_id === current?.section_id);

  const palette: PaletteItem[] = questions.map((q, index) => ({
    questionId: q.question_id,
    index,
    answered: Boolean(local[q.question_id]?.label),
    flagged: Boolean(local[q.question_id]?.flagged),
  }));

  // Palette dikelompokkan per section (BUG 13).
  const paletteGroups: PaletteGroup[] = useMemo(() => {
    if (!snapshot) return [];
    const groups: PaletteGroup[] = [];
    for (const s of snapshot.sections) {
      const items = palette.filter((p) => questions[p.index]?.section_id === s.section_id);
      if (items.length > 0) groups.push({ id: s.section_id, title: s.title, items });
    }
    const grouped = new Set(groups.flatMap((g) => g.items.map((i) => i.questionId)));
    const rest = palette.filter((p) => !grouped.has(p.questionId));
    if (rest.length > 0) groups.push({ id: "lainnya", title: "Lainnya", items: rest });
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, questions, local]);

  const answeredCount = palette.filter((p) => p.answered).length;

  const choose = (label: AnswerLabel) => {
    if (!current || audioPlaying || !isRunning) return;
    setLocal((prev) => ({
      ...prev,
      [current.question_id]: { label, flagged: prev[current.question_id]?.flagged ?? false },
    }));
    saveAnswer.mutate(
      {
        attemptId,
        questionId: current.question_id,
        questionIndex: activeIndex,
        label,
      },
      { onError: () => toast.error("Jawaban gagal disimpan. Periksa koneksi Anda.") },
    );
  };

  const toggleFlag = () => {
    if (!current || audioPlaying || !isRunning) return;
    const next = !local[current.question_id]?.flagged;
    setLocal((prev) => ({
      ...prev,
      [current.question_id]: { label: prev[current.question_id]?.label ?? null, flagged: next },
    }));
    setFlagMutation.mutate({
      attemptId,
      questionId: current.question_id,
      questionIndex: activeIndex,
      flagged: next,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Memulihkan ujian…
      </div>
    );
  }

  if (isError || !attempt || !snapshot || !current) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="font-medium text-foreground">
            {error instanceof Error ? error.message : "Ujian tidak dapat dimuat."}
          </p>
          <Button onClick={() => void navigate({ to: "/ujian" })}>Kembali ke daftar ujian</Button>
        </CardContent>
      </Card>
    );
  }

  if (!isRunning) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground">{snapshot.exam.title}</h1>
          <p className="text-sm text-muted-foreground">
            Attempt ini sudah selesai ({ATTEMPT_STATUS_LABELS[attempt.status]}).
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              onClick={() =>
                void navigate({ to: "/ujian/hasil/$attemptId", params: { attemptId } })
              }
            >
              Lihat hasil
            </Button>
            <Button variant="outline" onClick={() => void navigate({ to: "/ujian" })}>
              Kembali ke daftar ujian
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const navLocked = audioPlaying;
  const isLandscape = layout === "landscape";
  /** Banner hanya muncul saat benar-benar diperlukan (BUG 17). */
  const showFullscreenBanner = !isFullscreen && !submitting && (isArmed || isUnsupported);

  return (
    <div className={cn("space-y-4", isLandscape ? "pb-4" : "pb-40")}>
      {/* Header: judul, timer, layout, kumpulkan */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground">
            {snapshot.exam.title}
          </h1>
          <p className="text-xs text-muted-foreground">
            {answeredCount}/{questions.length} soal terjawab · Auto save aktif
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-9"
            aria-label={isLandscape ? "Ubah ke tata letak portrait" : "Ubah ke tata letak landscape"}
            title={isLandscape ? "Portrait" : "Landscape"}
            onClick={() => setLayout(isLandscape ? "portrait" : "landscape")}
          >
            {isLandscape ? (
              <RectangleVertical className="size-4" />
            ) : (
              <RectangleHorizontal className="size-4" />
            )}
          </Button>
          <Badge
            variant={remaining <= 60 ? "destructive" : "secondary"}
            className="tabular-nums text-sm"
          >
            {timerLabel}
          </Badge>
          <Button size="sm" variant="destructive" onClick={() => setConfirmSubmit(true)}>
            Kumpulkan
          </Button>
        </div>
      </div>

      {showFullscreenBanner ? (
        <button
          type="button"
          onClick={() => void requestFullscreen()}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border p-3 text-left",
            isArmed
              ? "border-destructive/40 bg-destructive/10"
              : "border-amber-500/40 bg-amber-500/10",
          )}
        >
          <AlertTriangle
            className={cn(
              "size-5 shrink-0",
              isArmed ? "text-destructive" : "text-amber-700 dark:text-amber-300",
            )}
          />
          <span
            className={cn(
              "flex-1 text-sm",
              isArmed ? "text-destructive" : "text-amber-700 dark:text-amber-300",
            )}
          >
            {isArmed
              ? `Mode layar penuh nonaktif. Pelanggaran ${violations}/${limit}. Aplikasi mencoba kembali otomatis; ketuk untuk mempercepat.`
              : "Peramban Anda belum mengizinkan mode layar penuh. Ketuk di sini untuk mengaktifkannya."}
          </span>
          <Maximize
            className={cn(
              "size-5 shrink-0",
              isArmed ? "text-destructive" : "text-amber-700 dark:text-amber-300",
            )}
          />
        </button>
      ) : null}

      {navLocked ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300">
          Audio sedang diputar. Navigasi dan pilihan jawaban terkunci sampai audio selesai.
        </p>
      ) : null}

      {/* Portrait: soal atas, jawaban bawah, palette bawah.
          Landscape: soal kiri, jawaban kanan, palette samping. */}
      <div className={cn("grid gap-4", isLandscape && "grid-cols-[1.2fr_1fr]")}>
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline">
                Soal {activeIndex + 1} dari {questions.length}
              </Badge>
              <Button
                type="button"
                size="sm"
                variant={local[current.question_id]?.flagged ? "default" : "outline"}
                onClick={toggleFlag}
                disabled={navLocked}
              >
                <Flag className="mr-1.5 size-4" />
                {local[current.question_id]?.flagged ? "Ditandai" : "Tandai"}
              </Button>
            </div>
            {section ? (
              <p className="text-xs text-muted-foreground">
                {section.title}
                {section.instruction ? ` — ${section.instruction}` : ""}
              </p>
            ) : null}
            <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
              {current.text}
            </p>
            {current.image_url ? (
              <img
                src={current.image_url}
                alt={`Gambar soal nomor ${activeIndex + 1}`}
                loading="lazy"
                className="mx-auto max-h-52 w-auto max-w-full rounded-xl border border-border object-contain sm:max-h-64"
              />
            ) : null}
            {current.audio_url ? (
              <LockedAudio
                src={current.audio_url}
                disabled={audioPlaying}
                onPlayingChange={setAudioPlaying}
              />
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-2 p-4">
              {current.answers.map((answer, answerIndex) => {
                const selected = local[current.question_id]?.label === answer.label;
                return (
                  <button
                    key={answer.label}
                    type="button"
                    disabled={navLocked}
                    onClick={() => choose(answer.label)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:bg-muted/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-foreground",
                      )}
                    >
                      {answerIndex + 1}
                    </span>
                    <span className="min-w-0 flex-1 space-y-2">
                      {answer.text ? (
                        <span className="block text-sm text-foreground">{answer.text}</span>
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
                        <span
                          className="block"
                          onClick={(event) => event.stopPropagation()}
                          role="presentation"
                        >
                          <SimpleAudio
                            src={answer.audio_url}
                            label={`Audio pilihan ${answerIndex + 1}`}
                          />
                        </span>
                      ) : null}
                      {!answer.text && !answer.image_url && !answer.audio_url ? (
                        <span className="block text-sm text-muted-foreground">
                          Pilihan {answerIndex + 1}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {isLandscape ? (
            <Card>
              <CardContent className="p-4">
                <QuestionPalette
                  groups={paletteGroups}
                  activeIndex={activeIndex}
                  disabled={navLocked}
                  onJump={setActiveIndex}
                />
                <Separator className="my-3" />
                <NavButtons
                  activeIndex={activeIndex}
                  total={questions.length}
                  disabled={navLocked}
                  onChange={setActiveIndex}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Palette & navigasi bawah untuk portrait */}
      {!isLandscape ? (
        <div className="fixed inset-x-0 bottom-0 z-50 max-h-[45vh] overflow-y-auto border-t border-border bg-background/95 p-3 backdrop-blur">
          <QuestionPalette
            groups={paletteGroups}
            activeIndex={activeIndex}
            disabled={navLocked}
            onJump={setActiveIndex}
          />
          <div className="mt-3">
            <NavButtons
              activeIndex={activeIndex}
              total={questions.length}
              disabled={navLocked}
              onChange={setActiveIndex}
            />
          </div>
        </div>
      ) : null}

      <SubmitExamDialog
        open={confirmSubmit}
        unanswered={questions.length - answeredCount}
        onOpenChange={setConfirmSubmit}
        onConfirm={() => void finish("manual")}
        pending={submitting}
      />
    </div>
  );
}

function NavButtons({
  activeIndex,
  total,
  disabled,
  onChange,
}: {
  activeIndex: number;
  total: number;
  disabled: boolean;
  onChange: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 flex-1"
        disabled={disabled || activeIndex === 0}
        onClick={() => onChange(Math.max(0, activeIndex - 1))}
      >
        <ChevronLeft className="mr-1 size-4" /> Sebelumnya
      </Button>
      <Button
        type="button"
        className="h-11 flex-1"
        disabled={disabled || activeIndex >= total - 1}
        onClick={() => onChange(Math.min(total - 1, activeIndex + 1))}
      >
        Berikutnya <ChevronRight className="ml-1 size-4" />
      </Button>
    </div>
  );
}
