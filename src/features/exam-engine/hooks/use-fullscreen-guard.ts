import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  /** Guard hanya diaktifkan saat attempt benar-benar berjalan (dan belum submit). */
  enabled: boolean;
  onViolation: (count: number) => void;
  /** Jeda tambahan pelanggaran selama siswa tetap di luar fullscreen (ms). */
  intervalMs?: number;
};

/**
 * Fullscreen Guard (Sprint 10D).
 * URUTAN WAJIB: minta fullscreen → fullscreen SUKSES → guard aktif (armed).
 * Setelah armed dan siswa keluar fullscreen:
 *  - pelanggaran LANGSUNG +1,
 *  - lalu countdown `intervalMs`; jika masih di luar fullscreen, +1 lagi, berulang,
 *  - begitu kembali fullscreen, countdown dibatalkan dan counter berhenti.
 * Guard berhenti total saat `enabled` = false (mis. proses submit dimulai).
 */
export function useFullscreenGuard({ enabled, onViolation, intervalMs = 3000 }: Options) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isArmed, setIsArmed] = useState(false);
  /** True hanya bila peramban benar-benar tidak punya Fullscreen API. */
  const [isUnsupported, setIsUnsupported] = useState(false);
  const localCount = useRef(0);
  const armedRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const violationRef = useRef(onViolation);
  violationRef.current = onViolation;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const supported =
      typeof document.documentElement.requestFullscreen === "function" &&
      (document.fullscreenEnabled ?? true);
    setIsUnsupported(!supported);
  }, []);

  const requestFullscreen = useCallback(async () => {
    const element = document.documentElement;
    if (document.fullscreenElement) return true;
    if (typeof element.requestFullscreen !== "function") {
      setIsUnsupported(true);
      return false;
    }
    try {
      await element.requestFullscreen({ navigationUI: "hide" });
      return true;
    } catch {
      // Browser menolak (butuh gestur pengguna) — bukan berarti tidak didukung.
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void requestFullscreen();
  }, [enabled, requestFullscreen]);

  useEffect(() => {
    const handler = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (active && !armedRef.current) {
        armedRef.current = true;
        setIsArmed(true);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Pelanggaran: +1 seketika saat keluar, lalu +1 setiap `intervalMs` bila tetap di luar.
  useEffect(() => {
    if (!enabled || !isArmed || isFullscreen) return;
    localCount.current += 1;
    violationRef.current(localCount.current);
    const id = window.setInterval(() => {
      if (!enabledRef.current || document.fullscreenElement) return;
      localCount.current += 1;
      violationRef.current(localCount.current);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, isArmed, isFullscreen, intervalMs]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  return { isFullscreen, isArmed, isUnsupported, requestFullscreen, exitFullscreen };
}
