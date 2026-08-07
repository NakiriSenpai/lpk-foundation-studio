import { useEffect, type ReactNode } from "react";
import { Maximize, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WorkspaceSidebar, type PaletteGroup } from "./workspace-sidebar";

/**
 * Shell Exam Workspace (Sprint 11).
 * Struktur tetap: HEADER → BODY → FOOTER, sidebar di kiri BODY.
 * Dipakai bersama oleh Exam, Result, dan Review.
 */
export function WorkspaceShell({
  header,
  footer,
  children,
  sidebar,
  portrait,
  onRotateRetry,
  fullscreenBanner,
}: {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  sidebar?:
    | {
        groups: PaletteGroup[];
        activeIndex: number;
        collapsed: boolean;
        disabled: boolean;
        mode: "exam" | "review";
        onToggle: () => void;
        onJump: (index: number) => void;
      }
    | undefined;
  portrait: boolean;
  onRotateRetry: () => void;
  fullscreenBanner?: ReactNode;
}) {
  // ANTI COPY — hanya pada Workspace.
  useEffect(() => {
    const isEditable = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return Boolean(el?.closest?.("input, textarea, [contenteditable='true']"));
    };
    const block = (event: Event) => {
      if (isEditable(event.target)) return;
      event.preventDefault();
    };
    const events = ["copy", "cut", "paste", "contextmenu", "dragstart", "selectstart"];
    events.forEach((name) => document.addEventListener(name, block));
    return () => events.forEach((name) => document.removeEventListener(name, block));
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background select-none"
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
    >
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-card px-3">
        {header}
      </header>

      {fullscreenBanner}

      <div className="flex min-h-0 flex-1">
        {sidebar ? <WorkspaceSidebar {...sidebar} /> : null}
        <main className="min-w-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-[1120px] p-3">{children}</div>
        </main>
      </div>

      {footer ? (
        <footer className="flex h-14 shrink-0 items-center gap-2 border-t border-border bg-card px-3">
          {footer}
        </footer>
      ) : null}

      {portrait ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center">
          <RotateCw className="size-8 text-primary" />
          <p className="text-sm font-medium text-foreground">
            Putar perangkat Anda ke mode landscape untuk melanjutkan.
          </p>
          <Button size="sm" onClick={onRotateRetry}>
            Kunci Landscape
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Banner kecil saat keluar dari mode layar penuh (tanpa popup). */
export function FullscreenBanner({
  violations,
  limit,
  onRequest,
}: {
  violations: number;
  limit: number;
  onRequest: () => void;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b px-3 py-1.5 text-xs",
        "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      <span className="font-medium">Anda keluar dari mode layar penuh.</span>
      <span className="tabular-nums">
        Pelanggaran: {violations} / {limit}
      </span>
      <span>Kembali ke mode layar penuh.</span>
      <Button size="sm" className="ml-auto h-7 px-2 text-xs" onClick={onRequest}>
        <Maximize className="mr-1 size-3.5" /> Masuk Fullscreen
      </Button>
    </div>
  );
}
