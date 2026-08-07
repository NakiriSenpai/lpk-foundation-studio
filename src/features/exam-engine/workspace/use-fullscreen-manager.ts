import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Fullscreen Manager (Sprint 11).
 * State: IDLE → REQUEST → ACTIVE → OUTSIDE → FINISHED.
 * Counter HANYA aktif pada state OUTSIDE (setelah pernah ACTIVE),
 * sehingga tidak pernah ada false positive saat REQUEST maupun FINISHED.
 */
export type FullscreenState = "IDLE" | "REQUEST" | "ACTIVE" | "OUTSIDE" | "FINISHED";

type Options = {
  /** Workspace sedang berjalan (attempt in_progress dan belum submit). */
  active: boolean;
  /** Dipanggil tiap pelanggaran (+1). */
  onViolation?: (() => void) | undefined;
  intervalMs?: number;
};

export function useFullscreenManager({ active, onViolation, intervalMs = 3000 }: Options) {
  const [state, setState] = useState<FullscreenState>("IDLE");
  const everActive = useRef(false);
  const violationRef = useRef(onViolation);
  violationRef.current = onViolation;
  const finishedRef = useRef(false);

  const request = useCallback(async () => {
    if (finishedRef.current) return false;
    const el = document.documentElement;
    if (document.fullscreenElement) {
      setState("ACTIVE");
      everActive.current = true;
      return true;
    }
    if (typeof el.requestFullscreen !== "function") return false;
    setState((prev) => (prev === "ACTIVE" ? prev : "REQUEST"));
    try {
      await el.requestFullscreen({ navigationUI: "hide" });
      return true;
    } catch {
      // Ditolak peramban (butuh gestur). Bukan pelanggaran.
      setState((prev) => (prev === "REQUEST" ? (everActive.current ? "OUTSIDE" : "IDLE") : prev));
      return false;
    }
  }, []);

  const finish = useCallback(() => {
    finishedRef.current = true;
    setState("FINISHED");
  }, []);

  const exit = useCallback(() => {
    finishedRef.current = true;
    setState("FINISHED");
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  // Sinkronisasi dengan peramban.
  useEffect(() => {
    const handler = () => {
      if (finishedRef.current) return;
      if (document.fullscreenElement) {
        everActive.current = true;
        setState("ACTIVE");
      } else {
        setState(everActive.current ? "OUTSIDE" : "IDLE");
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Percobaan pertama (tanpa gestur) — aman, tidak menaikkan counter bila gagal.
  useEffect(() => {
    if (!active || finishedRef.current) return;
    void request();
  }, [active, request]);

  // Counter pelanggaran: +1 seketika, lalu +1 setiap `intervalMs` selama tetap OUTSIDE.
  useEffect(() => {
    if (!active || state !== "OUTSIDE") return;
    violationRef.current?.();
    const id = window.setInterval(() => {
      if (document.fullscreenElement || finishedRef.current) return;
      violationRef.current?.();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [active, state, intervalMs]);

  return {
    state,
    isOutside: state === "OUTSIDE",
    isActive: state === "ACTIVE",
    request,
    finish,
    exit,
  };
}
