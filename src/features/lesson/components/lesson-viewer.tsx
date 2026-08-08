import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EXAM_DIFFICULTY_LABELS } from "@/features/exam/exam.constants";
import { lessonCategoryLabel } from "@/features/lesson/lesson.constants";
import { useAuth } from "@/hooks/auth";
import {
  useCompleteLesson,
  useLesson,
  useLessonBlocks,
  useLessonProgress,
  useLessonQuestions,
  useLessonSections,
  useStartLesson,
  useUpdateLessonProgress,
} from "@/hooks/lesson";

import { LessonBlockRenderer } from "./lesson-block-renderer";
import { LessonPractice } from "./lesson-practice";

/**
 * Student Lesson Viewer (Sprint 16).
 *
 * Materi dibaca per bagian (section) mengikuti struktur Lesson Studio.
 * Progress ditulis lewat RPC server; staf (owner/admin/guru) boleh membaca
 * materi tanpa menghasilkan lesson_progress.
 */
export function LessonViewer({
  lessonId,
  onBack,
}: {
  lessonId: string;
  onBack: () => void;
}) {
  const { profile } = useAuth();
  const isStudent = profile?.role === "siswa";

  const lessonQuery = useLesson(lessonId);
  const sectionsQuery = useLessonSections(lessonId);
  const blocksQuery = useLessonBlocks(lessonId);
  const questionsQuery = useLessonQuestions(lessonId);
  const progressQuery = useLessonProgress(lessonId);

  const startLesson = useStartLesson();
  const markProgress = useUpdateLessonProgress();
  const completeLesson = useCompleteLesson();

  const [step, setStep] = useState(0);
  const [resumed, setResumed] = useState(false);
  const startedRef = useRef<string | null>(null);
  const markedRef = useRef<Set<string>>(new Set());
  const topRef = useRef<HTMLDivElement>(null);

  const lesson = lessonQuery.data;
  const sections = useMemo(() => sectionsQuery.data ?? [], [sectionsQuery.data]);
  const blocks = useMemo(() => blocksQuery.data ?? [], [blocksQuery.data]);
  const questions = questionsQuery.data ?? [];
  const progress = progressQuery.data ?? null;

  const category = lesson?.category ?? "umum";
  const currentSection = sections[step];
  const sectionBlocks = useMemo(
    () => (currentSection ? blocks.filter((b) => b.section_id === currentSection.id) : []),
    [blocks, currentSection],
  );
  const sectionQuestions = currentSection
    ? questions.filter((q) => q.section_id === currentSection.id)
    : [];

  const isLast = sections.length > 0 && step >= sections.length - 1;
  const completed = progress?.status === "completed";

  // Resume: posisi terakhir siswa diambil dari database, bukan localStorage.
  useEffect(() => {
    if (resumed || !isStudent || sections.length === 0 || blocks.length === 0) return;
    if (progressQuery.isLoading) return;
    const blockId = progress?.current_block_id;
    if (blockId) {
      const block = blocks.find((b) => b.id === blockId);
      const index = block ? sections.findIndex((s) => s.id === block.section_id) : -1;
      if (index >= 0) setStep(index);
    }
    setResumed(true);
  }, [resumed, isStudent, sections, blocks, progress, progressQuery.isLoading]);

  // Membuka materi = membuat/menyegarkan progress (idempotent, siswa saja).
  useEffect(() => {
    if (!isStudent || !lesson || startedRef.current === lessonId) return;
    startedRef.current = lessonId;
    startLesson.mutate(lessonId, {
      onError: () => toast.error("Progres materi belum tersimpan. Periksa koneksi Anda."),
    });
  }, [isStudent, lesson, lessonId, startLesson]);

  // Berpindah bagian = menandai block bagian tersebut sebagai selesai dibaca.
  useEffect(() => {
    if (!isStudent || !resumed || !currentSection || sectionBlocks.length === 0) return;
    if (markedRef.current.has(currentSection.id)) return;
    markedRef.current.add(currentSection.id);
    markProgress.mutate(
      {
        lessonId,
        blockIds: sectionBlocks.filter((b) => b.type !== "divider").map((b) => b.id),
        currentBlockId: sectionBlocks[0]?.id ?? null,
      },
      {
        onError: () => {
          markedRef.current.delete(currentSection.id);
          toast.error("Progres belum tersimpan. Akan dicoba lagi.");
        },
      },
    );
  }, [isStudent, resumed, currentSection, sectionBlocks, lessonId, markProgress]);

  const goTo = (next: number) => {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFinish = () => {
    if (!isStudent || progress?.status === "completed") return onBack();

    completeLesson.mutate(lessonId, {
      onSuccess: () => toast.success("Materi selesai dipelajari."),
      onError: () => toast.error("Gagal menyelesaikan materi. Coba lagi."),
    });
  };

  if (lessonQuery.isLoading || sectionsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (lessonQuery.isError || !lesson || lesson.status !== "published") {
    return (
      <div className="space-y-3 rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-foreground">Materi tidak ditemukan.</p>
        <Button variant="outline" onClick={onBack}>
          Kembali ke Materi
        </Button>
      </div>
    );
  }

  const percent = isStudent
    ? (progress?.progress_percent ?? 0)
    : sections.length > 0
      ? Math.round(((step + 1) / sections.length) * 100)
      : 0;

  return (
    <article ref={topRef} className="space-y-5 pb-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 justify-self-start" onClick={onBack}>
          <ArrowLeft className="mr-1 size-4" aria-hidden /> Kembali ke Materi
        </Button>
        {completed ? (
          <Badge className="shrink-0">
            <CheckCircle2 className="mr-1 size-3.5" aria-hidden /> Selesai
          </Badge>
        ) : null}
      </div>

      <header className="space-y-2.5">
        {lesson.thumbnail_url ? (
          <img
            src={lesson.thumbnail_url}
            alt={`Sampul ${lesson.title}`}
            loading="lazy"
            className="max-h-56 w-full rounded-2xl object-cover"
          />
        ) : null}
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {lessonCategoryLabel(lesson.category)}
        </p>
        <h1 className="text-2xl font-semibold leading-tight text-foreground">{lesson.title}</h1>
        {lesson.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{lesson.description}</p>
        ) : null}
        <Badge variant="outline">{EXAM_DIFFICULTY_LABELS[lesson.difficulty]}</Badge>
      </header>

      {sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Materi ini belum memiliki konten.
        </p>
      ) : (
        <>
          <section className="space-y-4 border-t border-border pt-5">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Bagian {step + 1} dari {sections.length}
              </p>
              <h2 className="text-lg font-semibold leading-snug text-foreground">
                {currentSection?.title}
              </h2>
              {currentSection?.description ? (
                <p className="text-sm text-muted-foreground">{currentSection.description}</p>
              ) : null}
            </div>

            {blocksQuery.isLoading ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (
              <div className="space-y-4">
                {sectionBlocks.map((block) => (
                  <LessonBlockRenderer key={block.id} block={block} category={category} />
                ))}
              </div>
            )}

            <LessonPractice questions={sectionQuestions} />
          </section>

          <footer className="space-y-3 border-t border-border pt-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progres materi</span>
                <span>{percent}% selesai</span>
              </div>
              <Progress value={percent} className="h-1.5" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="min-h-11"
                disabled={step === 0}
                onClick={() => goTo(step - 1)}
              >
                <ArrowLeft className="mr-1 size-4" aria-hidden /> Sebelumnya
              </Button>
              {isLast ? (
                <Button
                  className="min-h-11"
                  disabled={completeLesson.isPending}
                  onClick={handleFinish}
                >
                  {completeLesson.isPending ? (
                    <Loader2 className="mr-1 size-4 animate-spin" aria-hidden />
                  ) : (
                    <BookOpenCheck className="mr-1 size-4" aria-hidden />
                  )}
                  {completed ? "Kembali ke Materi" : "Selesaikan Materi"}
                </Button>
              ) : (
                <Button className="min-h-11" onClick={() => goTo(step + 1)}>
                  Berikutnya <ArrowRight className="ml-1 size-4" aria-hidden />
                </Button>
              )}
            </div>

            {completed ? (
              <p className="text-center text-xs text-muted-foreground">
                Anda sudah menyelesaikan materi ini. Silakan pelajari lagi kapan saja.
              </p>
            ) : null}
          </footer>
        </>
      )}
    </article>
  );
}
