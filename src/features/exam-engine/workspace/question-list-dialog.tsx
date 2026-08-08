import { Flag } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaletteStatus = "unanswered" | "answered" | "correct" | "wrong";

export type PaletteItem = {
  questionId: string;
  index: number;
  status: PaletteStatus;
  flagged: boolean;
};

export type PaletteGroup = {
  id: string;
  title: string;
  items: PaletteItem[];
};

const statusClass: Record<PaletteStatus, string> = {
  unanswered: "border-border bg-background text-foreground",
  answered: "border-primary bg-primary text-primary-foreground",
  correct: "border-emerald-500 bg-emerald-500 text-white",
  wrong: "border-destructive bg-destructive text-destructive-foreground",
};

/**
 * Daftar Soal sebagai popup terpusat (Sprint 11A).
 * Dikelompokkan per bagian ujian, responsif dari mobile hingga desktop.
 */
export function QuestionListDialog({
  open,
  onOpenChange,
  groups,
  activeIndex,
  mode,
  onJump,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: PaletteGroup[];
  activeIndex: number;
  mode: "exam" | "review";
  onJump: (index: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>Daftar Soal</DialogTitle>
          <DialogDescription className="sr-only">
            Pilih nomor soal untuk berpindah.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          {mode === "exam" ? (
            <>
              <Legend className="bg-primary" text="Sudah dijawab" />
              <Legend className="border border-border bg-background" text="Belum dijawab" />
            </>
          ) : (
            <>
              <Legend className="bg-emerald-500" text="Benar" />
              <Legend className="bg-destructive" text="Salah" />
              <Legend className="border border-border bg-background" text="Tidak dijawab" />
            </>
          )}
          <span className="flex items-center gap-1.5">
            <Flag className="size-3 text-amber-500" /> Ditandai
          </span>
        </div>

        <div className="space-y-4">
          {groups.map((group) => (
            <section key={group.id} className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:grid-cols-10">
                {group.items.map((item) => (
                  <button
                    key={item.questionId}
                    type="button"
                    aria-label={`Soal nomor ${item.index + 1}`}
                    aria-current={item.index === activeIndex}
                    onClick={() => {
                      onJump(item.index);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "relative flex h-9 min-w-0 items-center justify-center rounded-md border text-xs font-semibold",
                      statusClass[item.status],
                      item.index === activeIndex &&
                        "ring-2 ring-ring ring-offset-1 ring-offset-background",
                    )}
                  >
                    {item.index + 1}
                    {item.flagged ? (
                      <Flag className="absolute -right-0.5 -top-0.5 size-3 fill-amber-400 text-amber-500" />
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
          Tutup
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Legend({ className, text }: { className: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded", className)} /> {text}
    </span>
  );
}
