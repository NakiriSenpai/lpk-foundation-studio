import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  /** Guard hanya diaktifkan saat attempt benar-benar berjalan (dan belum submit). */
  enabled: boolean;
  onViolation: (count: number) => void;
  /** Jeda percobaan masuk fullscreen ulang setelah siswa keluar (ms). */
  retryMs?: number;
};

/**
 * Fullscreen Guard.
 * URUTAN WAJIB: minta fullscreen → fullscreen SUKSES → guard baru aktif (armed).
 * Setelah armed dan siswa keluar fullscreen:
 *  - pelanggaran dicatat,
 *  - setiap `retryMs` aplikasi mencoba masuk fullscreen lagi,
 *  - bila percobaan gagal, pelanggaran bertambah lagi.
 * Guard berhenti total saat `enabled` = false (mis. proses submit dimulai).
 */
export function useFullscreenGuard({ enabled, onViolation, retryMs = 4000 }: Options) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isArmed, setIsArmed] = useState(false);
  const [isUnsupported, setIsUnsupported] = useState(false);
  const localCount = useRef(0);
  const armedRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const violationRef = useRef(onViolation);
  violationRef.current = onViolation;

  const requestFullscreen = useCallback(async () => {
    const element = document.documentElement;
    if (document.fullscreenElement) return true;
    if (typeof element.requestFullscreen !== "function") {
      setIsUnsupported(true);
      return false;
    }
    try {
      await element.requestFullscreen({ navigationUI: "hide" });
      setIsUnsupported(false);
      return true;
    } catch {
      // Browser dapat menolak jika bukan hasil interaksi pengguna.
      setIsUnsupported(true);
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
      if (active) {
        setIsUnsupported(false);
        if (!armedRef.current) {
          armedRef.current = true;
          setIsArmed(true);
        }
        return;
      }
      if (armedRef.current && enabledRef.current) {
        localCount.current += 1;
        violationRef.current(localCount.current);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // AUTO RECOVERY: coba kembali ke fullscreen; gagal = pelanggaran baru.
  useEffect(() => {
    if (!enabled || !isArmed || isFullscreen) return;
    const id = window.setInterval(() => {
      if (!enabledRef.current) return;
      void requestFullscreen().then((ok) => {
        if (ok || !enabledRef.current) return;
        localCount.current += 1;
        violationRef.current(localCount.current);
      });
    }, retryMs);
    return () => window.clearInterval(id);
  }, [enabled, isArmed, isFullscreen, retryMs, requestFullscreen]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  return { isFullscreen, isArmed, isUnsupported, requestFullscreen, exitFullscreen };
}
