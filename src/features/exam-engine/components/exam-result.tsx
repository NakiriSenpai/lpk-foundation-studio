import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, CircleSlash, Loader2, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAttemptResult, useStartAttempt } from "@/hooks/attempt";
import { cn } from "@/lib/utils";
import { formatDurasi } from "@/types/attempt";
import { formatTanggal } from "@/utils/format";
import { lockOrientation, useExamLayout } from "../hooks/use-exam-layout";

/** Result Page — hanya MEMBACA hasil yang sudah dihitung saat submit. */
export function ExamResult({ attemptId }: { attemptId: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useAttemptResult(attemptId);
  const startAttempt = useStartAttempt();
  /** BUG 2: Result tetap fullscreen dan mengikuti orientasi halaman ujian. */
  const { layout, isLandscape } = useExamLayout(attemptId);

  useEffect(() => {
    void lockOrientation(layout);
  }, [layout]);

  const exitExam = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    void navigate({ to: "/ujian" });
  };


  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Memuat hasil ujian…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="font-medium text-foreground">
            {error instanceof Error ? error.message : "Hasil ujian tidak dapat dimuat."}
          </p>
          <Button onClick={() => void navigate({ to: "/ujian" })}>Kembali ke daftar ujian</Button>
        </CardContent>
      </Card>
    );
  }

  const retry = () => {
    startAttempt.mutate(data.exam_id, {
      onSuccess: (attempt) => {
        void navigate({ to: "/ujian/$attemptId", params: { attemptId: attempt.id } });
      },
      onError: (retryError) =>
        toast.error(retryError instanceof Error ? retryError.message : "Gagal memulai ujian baru."),
    });
  };

  const stats = [
    { label: "Benar", value: data.correct_count, icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Salah", value: data.wrong_count, icon: XCircle, tone: "text-destructive" },
    {
      label: "Kosong",
      value: data.skipped_count,
      icon: CircleSlash,
      tone: "text-muted-foreground",
    },
  ];

  return (
    <div className={cn("mx-auto w-full space-y-4", isLandscape ? "max-w-4xl" : "max-w-2xl")}>
      <Card>
        <CardContent className="space-y-4 p-5 text-center">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Hasil Ujian</p>
            <h1 className="text-lg font-semibold text-foreground">{data.exam_title}</h1>
          </div>

          <div className="space-y-2">
            <p className="text-5xl font-bold tabular-nums text-foreground">
              {Number(data.score).toLocaleString("id-ID")}
            </p>
            <p className="text-sm text-muted-foreground">
              Passing score: {Number(data.passing_score).toLocaleString("id-ID")}
            </p>
            <Badge variant={data.passed ? "default" : "destructive"} className="px-4 py-1 text-sm">
              {data.passed ? "LULUS" : "TIDAK LULUS"}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border p-3">
                <stat.icon className={`mx-auto size-5 ${stat.tone}`} />
                <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <dl className="space-y-1 text-left text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Jumlah soal</dt>
              <dd className="font-medium text-foreground">{data.total_questions}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Durasi</dt>
              <dd className="font-medium text-foreground">{formatDurasi(data.duration_seconds)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Tanggal</dt>
              <dd className="font-medium text-foreground">{formatTanggal(data.submitted_at)}</dd>
            </div>
            {data.auto_submitted ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Catatan</dt>
                <dd className="font-medium text-foreground">
                  {data.submit_reason === "time_up"
                    ? "Dikumpulkan otomatis (waktu habis)"
                    : "Dikumpulkan otomatis (pelanggaran layar penuh)"}
                </dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-2 sm:grid-cols-3">
        <Button
          onClick={() => void navigate({ to: "/ujian/review/$attemptId", params: { attemptId } })}
        >
          Review Ujian
        </Button>
        <Button variant="secondary" onClick={retry} disabled={startAttempt.isPending}>
          {startAttempt.isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" />
          ) : (
            <RotateCcw className="mr-1.5 size-4" />
          )}
          Coba Lagi
        </Button>
        <Button variant="outline" onClick={exitExam}>
          <ArrowLeft className="mr-1.5 size-4" /> Keluar
        </Button>

      </div>
    </div>
  );
}
