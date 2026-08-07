import { memo } from "react";
import { Flag } from "lucide-react";

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

type Props = {
  groups: PaletteGroup[];
  activeIndex: number;
  collapsed: boolean;
  disabled: boolean;
  mode: "exam" | "review";
  onToggle: () => void;
  onJump: (index: number) => void;
};

const statusClass: Record<PaletteStatus, string> = {
  unanswered: "border-border bg-background text-foreground",
  answered: "border-primary bg-primary text-primary-foreground",
  correct: "border-emerald-500 bg-emerald-500 text-white",
  wrong: "border-destructive bg-destructive text-destructive-foreground",
};

/**
 * Sidebar Question Palette bergaya EPS-TOPIK (Sprint 11).
 * Collapse hanya mengubah lebar sidebar — konten Workspace tidak ikut diskalakan.
 */
export const WorkspaceSidebar = memo(function WorkspaceSidebar({
  groups,
  activeIndex,
  collapsed,
  disabled,
  mode,
  onToggle,
  onJump,
}: Props) {
  return (
    <aside
      data-collapsed={collapsed}
      style={{ width: collapsed ? "3.25rem" : "15rem" }}
      className={cn(
        "relative z-10 flex h-full shrink-0 flex-col overflow-hidden border-r border-border bg-card",
        "transition-[width] duration-[240ms] ease-out will-change-[width]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={collapsed ? "Buka daftar soal" : "Tutup daftar soal"}
        className={cn(
          "flex h-11 w-full shrink-0 items-center gap-2 border-b border-border px-3 text-left",
          "text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted/60",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className="flex size-6 shrink-0 flex-col items-center justify-center gap-[3px]">
          <span className="block h-[2px] w-4 rounded bg-current" />
          <span className="block h-[2px] w-4 rounded bg-current" />
          <span className="block h-[2px] w-4 rounded bg-current" />
        </span>
        {collapsed ? null : <span className="truncate">Daftar Soal</span>}
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {groups.map((group) => (
          <div key={group.id} className="mb-3">
            {collapsed ? (
              <div className="mb-1 h-px bg-border" />
            ) : (
              <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
            )}
            <div className={cn("grid gap-1.5", collapsed ? "grid-cols-1" : "grid-cols-5")}>
              {group.items.map((item) => (
                <button
                  key={item.questionId}
                  type="button"
                  disabled={disabled}
                  onClick={() => onJump(item.index)}
                  aria-label={`Soal nomor ${item.index + 1}`}
                  aria-current={item.index === activeIndex}
                  className={cn(
                    "relative flex h-8 items-center justify-center rounded-md border text-xs font-semibold",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    statusClass[item.status],
                    item.index === activeIndex && "ring-2 ring-ring ring-offset-1 ring-offset-card",
                  )}
                >
                  {item.index + 1}
                  {item.flagged ? (
                    <Flag className="absolute -right-0.5 -top-0.5 size-3 fill-amber-400 text-amber-500" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {collapsed ? null : (
        <div className="shrink-0 space-y-1 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          {mode === "exam" ? (
            <>
              <Legend className="border border-border bg-background" text="Belum dijawab" />
              <Legend className="bg-primary" text="Sudah dijawab" />
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
      )}
    </aside>
  );
});

function Legend({ className, text }: { className: string; text: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3 rounded", className)} /> {text}
    </span>
  );
}
