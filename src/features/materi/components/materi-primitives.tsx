import type { ReactNode } from "react";
import { Bookmark, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CategoryMeta } from "@/features/materi/materi.constants";

/** Bar progres beraksen kategori. */
export function ToneBar({ value, bar, className }: { value: number; bar: string; className?: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-progress-track", className)}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${safe}%` }} />
    </div>
  );
}

/** Tile ikon kategori (gradien solid). */
export function CategoryTile({
  meta,
  size = "md",
}: {
  meta: CategoryMeta;
  size?: "sm" | "md" | "lg";
}) {
  const Icon = meta.icon;
  const box = size === "lg" ? "size-14 rounded-2xl" : size === "sm" ? "size-9 rounded-xl" : "size-11 rounded-2xl";
  const glyph = size === "lg" ? "size-7" : size === "sm" ? "size-4.5" : "size-5";
  return (
    <span className={cn("grid shrink-0 place-items-center shadow-sm", box, meta.tone.tile)}>
      <Icon className={glyph} aria-hidden />
    </span>
  );
}

/** Tombol bookmark materi. */
export function BookmarkButton({
  active,
  disabled,
  onToggle,
  label,
}: {
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      aria-label={active ? `Hapus bookmark ${label}` : `Simpan ${label} ke bookmark`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full border transition-colors",
        active
          ? "border-cat-bookmark/40 bg-cat-bookmark/15 text-cat-bookmark"
          : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground",
      )}
    >
      <Bookmark className={cn("size-4", active && "fill-current")} aria-hidden />
    </button>
  );
}

/** Chip filter horizontal. */
export function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/15 text-foreground"
          : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

/** Baris navigasi kategori pada "Daftar materi". */
export function CategoryRow({
  meta,
  caption,
  onClick,
}: {
  meta: CategoryMeta;
  caption: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50"
    >
      <CategoryTile meta={meta} size="sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">{meta.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{caption}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
