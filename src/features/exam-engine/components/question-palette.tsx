import { Flag } from "lucide-react";

import { cn } from "@/lib/utils";

export type PaletteItem = {
  questionId: string;
  index: number;
  answered: boolean;
  flagged: boolean;
};

export type PaletteGroup = {
  id: string;
  title: string;
  items: PaletteItem[];
};

type Props = {
  groups: PaletteGroup[];
  activeIndex: number;
  disabled: boolean;
  onJump: (index: number) => void;
};

/** Question Palette, dikelompokkan per Section (Reading / Listening). */
export function QuestionPalette({ groups, activeIndex, disabled, onJump }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-border bg-background" /> Belum dijawab
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-primary" /> Sudah dijawab
        </span>
        <span className="flex items-center gap-1.5">
          <Flag className="size-3 text-amber-500" /> Ditandai
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.id} className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
            {group.items.map((item) => (
              <button
                key={item.questionId}
                type="button"
                disabled={disabled}
                onClick={() => onJump(item.index)}
                aria-label={`Soal nomor ${item.index + 1}`}
                aria-current={item.index === activeIndex}
                className={cn(
                  "relative flex h-10 items-center justify-center rounded-lg border text-sm font-semibold transition",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  item.answered
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground",
                  item.index === activeIndex &&
                    "ring-2 ring-ring ring-offset-2 ring-offset-background",
                )}
              >
                {item.index + 1}
                {item.flagged ? (
                  <Flag className="absolute -right-1 -top-1 size-3.5 fill-amber-400 text-amber-500" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
