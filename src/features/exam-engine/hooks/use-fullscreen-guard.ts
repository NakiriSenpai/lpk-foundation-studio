import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  enabled: boolean;
  onViolation: (count: number) => void;
};

/**
 * Fullscreen Guard: masuk fullscreen otomatis, hitung setiap kali siswa keluar.
 * Hitungan disimpan di server melalui `onViolation`.
 */
export function useFullscreenGuard({ enabled, onViolation }: Options) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const localCount = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const requestFullscreen = useCallback(async () => {
    const element = document.documentElement;
    if (document.fullscreenElement) return;
    try {
      await element.requestFullscreen({ navigationUI: "hide" });
    } catch {
      // Browser dapat menolak jika bukan hasil interaksi pengguna.
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
      if (!active && enabledRef.current) {
        localCount.current += 1;
        onViolation(localCount.current);
      }
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [onViolation]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, []);

  return { isFullscreen, requestFullscreen, exitFullscreen };
}
