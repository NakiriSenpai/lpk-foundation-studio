import { useEffect, type ReactNode } from "react";
import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Shell Exam Workspace (Sprint 11A).
 * Struktur tetap: HEADER → MAIN → FOOTER. Landscape only.
 * Dipakai bersama oleh Exam, Result, dan Review.
 */
export function WorkspaceShell({
  header,
  footer,
  children,
  portrait,
  onRotateRetry,
}: {
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  portrait: boolean;
  onRotateRetry: () => void;
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

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[1200px] p-3">{children}</div>
      </main>

      {footer ? (
        <footer className="grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border bg-card px-3">
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
