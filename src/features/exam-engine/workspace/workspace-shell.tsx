import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shell Exam Workspace (Sprint 11 FINAL).
 *
 * Struktur tetap: HEADER → [ASIDE | MAIN] → FOOTER, tinggi 100dvh.
 * Hanya area yang ditandai yang boleh scroll — halaman tidak pernah scroll penuh.
 */
export function WorkspaceShell({
  header,
  footer,
  aside,
  asideOpen = false,
  gate,
  children,
}: {
  header: ReactNode;
  footer?: ReactNode;
  /** Panel Daftar Soal kiri (desktop/tablet). */
  aside?: ReactNode;
  asideOpen?: boolean;
  /** Overlay orientation/fullscreen gate. */
  gate?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex h-[100dvh] w-full select-none flex-col overflow-hidden bg-background text-foreground"
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background-elevated px-3">
        {header}
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        {aside ? (
          <div
            className={cn(
              "min-h-0 shrink-0 overflow-hidden border-border bg-background-elevated transition-[width] duration-300 ease-out",
              asideOpen ? "w-[260px] border-r" : "w-0",
            )}
          >
            <div className="h-full w-[260px] overflow-y-auto overscroll-contain p-3">{aside}</div>
          </div>
        ) : null}

        <main className="min-h-0 min-w-0 flex-1">{children}</main>
      </div>

      {footer ? (
        <footer className="grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border bg-background-elevated px-3">
          {footer}
        </footer>
      ) : null}

      {gate}
    </div>
  );
}

/**
 * Body dua panel: SOAL kiri tetap terlihat, JAWABAN kanan yang scroll.
 * `explanation` (Review) menempati area bawah dengan scroll internal sendiri.
 */
export function WorkspaceBody({
  question,
  answers,
  explanation,
}: {
  question: ReactNode;
  answers: ReactNode;
  explanation?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-2 sm:gap-3 sm:p-3">
      <div className="grid min-h-0 flex-1 gap-2 sm:gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain">{question}</div>
        <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain">{answers}</div>
      </div>
      {explanation ? (
        <div className="min-h-0 shrink-0 basis-[34%] overflow-hidden">{explanation}</div>
      ) : null}
    </div>
  );
}
