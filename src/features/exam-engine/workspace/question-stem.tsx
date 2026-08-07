import { memo, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AudioButton } from "./audio-manager";

/** Batang soal (teks, gambar, audio) — dipakai Exam dan Review. */
export const QuestionStem = memo(function QuestionStem({
  questionId,
  number,
  total,
  sectionTitle,
  sectionInstruction,
  text,
  imageUrl,
  audioUrl,
  right,
}: {
  questionId: string;
  number: number;
  total: number;
  sectionTitle?: string | undefined;
  sectionInstruction?: string | null | undefined;
  text: string;
  imageUrl: string | null;
  audioUrl: string | null;
  right?: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="shrink-0">
          Soal {number} dari {total}
        </Badge>
        {right}
      </div>
      {sectionTitle ? (
        <p className="text-xs text-muted-foreground">
          {sectionTitle}
          {sectionInstruction ? ` — ${sectionInstruction}` : ""}
        </p>
      ) : null}
      <div className="flex items-start gap-3">
        {audioUrl ? (
          <AudioButton audioKey={`${questionId}:soal`} src={audioUrl} label="Putar audio soal" />
        ) : null}
        <p className="min-w-0 flex-1 whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
          {text}
        </p>
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Gambar soal nomor ${number}`}
          loading="lazy"
          draggable={false}
          className="mx-auto h-[168px] w-auto max-w-full rounded-lg border border-border object-contain"
        />
      ) : null}
    </div>
  );
});

/** Kerangka satu pilihan jawaban (nomor + konten). */
export function AnswerShell({
  index,
  selected,
  tone,
  onClick,
  disabled,
  children,
}: {
  index: number;
  selected?: boolean;
  tone?: "correct" | "wrong" | undefined;
  onClick?: (() => void) | undefined;
  disabled?: boolean;
  children: ReactNode;
}) {
  const className = cn(
    "flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors",
    tone === "correct"
      ? "border-emerald-500 bg-emerald-500/10"
      : tone === "wrong"
        ? "border-destructive bg-destructive/10"
        : selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card",
    onClick && "hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60",
  );
  const inner = (
    <>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 space-y-1.5">{children}</span>
    </>
  );

  if (!onClick) return <div className={className}>{inner}</div>;
  return (
    <button type="button" className={className} disabled={disabled} onClick={onClick}>
      {inner}
    </button>
  );
}
