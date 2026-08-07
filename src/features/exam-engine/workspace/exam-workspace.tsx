import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAttemptSession,
  useRecordViolation,
  useSaveAnswer,
  useSetFlag,
  useSubmitAttempt,
} from "@/hooks/attempt";
import type { AnswerLabel } from "@/types/exam";
import type { AttemptAnswerRow } from "@/types/attempt";
import { ATTEMPT_STATUS_LABELS } from "@/types/attempt";
import { SubmitExamDialog } from "../components/exam-dialogs";
import { AudioButton, AudioManagerProvider, useAudioManager } from "./audio-manager";
import { AnswerShell, QuestionStem } from "./question-stem";
import { useExamTimer } from "../hooks/use-exam-timer";
import { useFullscreenManager } from "./use-fullscreen-manager";
import { useLandscapeLock } from "./use-landscape";
import { FullscreenBanner, WorkspaceShell } from "./workspace-shell";
import type { PaletteGroup, PaletteItem } from "./workspace-sidebar";

type LocalAnswer = { label: AnswerLabel | null; flagged: boolean };

export function ExamWorkspace({ attemptId }: { attemptId: string }) {
  return (
    <AudioManagerProvider attemptId={attemptId} lockAfterPlay>
      <ExamWorkspaceInner attemptId={attemptId} />
    </AudioManagerProvider>
  );
}

function ExamWorkspaceInner({ attemptId }: { attemptId: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useAttemptSession(attemptId);
  const saveAnswer = useSaveAnswer();
  const setFlagMutation = useSetFlag();
  const recordViolation = useRecordViolation();
  const submit = useSubmitAttempt();
  const { busy: audioBusy } = useAudioManager();
  const { isPortrait, retry } = useLandscapeLock();

  const [activeIndex, setActiveIndex] = useState(0);
  const [local, setLocal] = useState<Record<string, LocalAnswer>>({});
  const [violations, setViolations] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const attempt = data?.attempt;
  const snapshot = data?.snapshot;
  const isRunning = attempt?.status === "in_progress";
  const limit = attempt?.fullscreen_limit ?? 4;

  useEffect(() => {
    if (!data) return;
    const restored: Record<string, LocalAnswer> = {};
    for (const row of data.answers as AttemptAnswerRow[]) {
      restored[row.question_id] = { label: row.selected_label, flagged: row.is_flagged };
    }
    setLocal(restored);
    setViolations(data.attempt.fullscreen_violations);
  }, [data]);

  const finishRef = useRef<
    ((reason: "manual" | "time_up" | "fullscreen_violation") => void) | null
  >(null);

  const fullscreen = useFullscreenManager({
    active: Boolean(isRunning) && !submitting,
    onViolation: useCallback(() => {
      if (submittingRef.current) return;
      void recordViolation.mutateAsync(attemptId).then((count) => {
        if (submittingRef.current) return;
        setViolations(count);
        if (count >= limit) finishRef.current?.("fullscreen_violation");
      });
    }, [attemptId, limit, recordViolation]),
  });

  const finish = useCallback(
    async (reason: "manual" | "time_up" | "fullscreen_violation") => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setConfirmSubmit(false);
      fullscreen.finish();
      try {
        await submit.mutateAsync({ attemptId, reason });
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
    [attemptId, fullscreen, navigate, submit],
  );
  finishRef.current = (reason) => void finish(reason);

  const {
    label: timerLabel,
    remaining,
    isReady: timerReady,
  } = useExamTimer(attempt?.expires_at, Boolean(isRunning), attempt?.started_at);

  useEffect(() => {
    if (isRunning && timerReady && remaining <= 0) void finish("time_up");
  }, [isRunning, timerReady, remaining, finish]);

  const questions = useMemo(() => snapshot?.questions ?? [], [snapshot]);
  const current = questions[activeIndex];
  const section = snapshot?.sections.find((s) => s.section_id === current?.section_id);

  const paletteGroups: PaletteGroup[] = useMemo(() => {
    if (!snapshot) return [];
    const items: PaletteItem[] = questions.map((q, index) => ({
      questionId: q.question_id,
      index,
      status: local[q.question_id]?.label ? "answered" : "unanswered",
      flagged: Boolean(local[q.question_id]?.flagged),
    }));
    const groups: PaletteGroup[] = [];
    for (const s of snapshot.sections) {
      const list = items.filter((p) => questions[p.index]?.section_id === s.section_id);
      if (list.length > 0) groups.push({ id: s.section_id, title: s.title, items: list });
    }
    const grouped = new Set(groups.flatMap((g) => g.items.map((i) => i.questionId)));
    const rest = items.filter((p) => !grouped.has(p.questionId));
    if (rest.length > 0) groups.push({ id: "lainnya", title: "Lainnya", items: rest });
    return groups;
  }, [snapshot, questions, local]);

  const answeredCount = Object.values(local).filter((a) => a.label).length;
  const locked = audioBusy;

  const choose = (label: AnswerLabel) => {
    if (!current || locked || !isRunning) return;
    setLocal((prev) => ({
      ...prev,
      [current.question_id]: { label, flagged: prev[current.question_id]?.flagged ?? false },
    }));
    saveAnswer.mutate(
      { attemptId, questionId: current.question_id, questionIndex: activeIndex, label },
      { onError: () => toast.error("Jawaban gagal disimpan. Periksa koneksi Anda.") },
    );
  };

  const toggleFlag = () => {
    if (!current || locked || !isRunning) return;
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

  return (
    <>
      <WorkspaceShell
        portrait={isPortrait}
        onRotateRetry={retry}
        fullscreenBanner={
          fullscreen.isOutside && !submitting ? (
            <FullscreenBanner
              violations={violations}
              limit={limit}
              onRequest={() => void fullscreen.request()}
            />
          ) : null
        }
        sidebar={{
          groups: paletteGroups,
          activeIndex,
          collapsed,
          disabled: locked,
          mode: "exam",
          onToggle: () => setCollapsed((v) => !v),
          onJump: (index) => setActiveIndex(index),
        }}
        header={
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {snapshot.exam.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {answeredCount}/{questions.length} terjawab · Auto Save aktif
              </p>
            </div>
            <Badge
              variant={remaining <= 60 ? "destructive" : "secondary"}
              className="shrink-0 tabular-nums text-sm"
            >
              {timerLabel}
            </Badge>
            <Button
              size="sm"
              variant="destructive"
              disabled={locked}
              onClick={() => setConfirmSubmit(true)}
            >
              Submit
            </Button>
          </>
        }
        footer={
          <>
            <Button
              type="button"
              size="sm"
              variant={local[current.question_id]?.flagged ? "default" : "outline"}
              disabled={locked}
              onClick={toggleFlag}
            >
              <Flag className="mr-1.5 size-4" />
              {local[current.question_id]?.flagged ? "Ditandai" : "Tandai"}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={locked || activeIndex === 0}
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft className="mr-1 size-4" /> Sebelumnya
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={locked || activeIndex >= questions.length - 1}
                onClick={() => setActiveIndex((i) => Math.min(questions.length - 1, i + 1))}
              >
                Berikutnya <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          </>
        }
      >
        <div className="grid gap-3 lg:grid-cols-2 lg:items-start">
          <QuestionStem
            questionId={current.question_id}
            number={activeIndex + 1}
            total={questions.length}
            sectionTitle={section?.title}
            sectionInstruction={section?.instruction}
            text={current.text}
            imageUrl={current.image_url}
            audioUrl={current.audio_url}
          />
          <div className="space-y-2">
            {current.answers.map((answer, answerIndex) => (
              <AnswerShell
                key={answer.label}
                index={answerIndex}
                selected={local[current.question_id]?.label === answer.label}
                disabled={locked}
                onClick={() => choose(answer.label)}
              >
                {answer.text ? (
                  <span className="block text-sm text-foreground">{answer.text}</span>
                ) : null}
                {answer.image_url ? (
                  <img
                    src={answer.image_url}
                    alt={`Pilihan ${answerIndex + 1}`}
                    loading="lazy"
                    draggable={false}
                    className="h-[88px] w-auto max-w-full rounded-lg border border-border object-contain"
                  />
                ) : null}
                {answer.audio_url ? (
                  <span
                    className="block"
                    role="presentation"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <AudioButton
                      size="sm"
                      audioKey={`${current.question_id}:${answer.label}`}
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
              </AnswerShell>
            ))}
          </div>
        </div>
      </WorkspaceShell>

      <SubmitExamDialog
        open={confirmSubmit}
        unanswered={questions.length - answeredCount}
        onOpenChange={setConfirmSubmit}
        onConfirm={() => void finish("manual")}
        pending={submitting}
      />
    </>
  );
}
