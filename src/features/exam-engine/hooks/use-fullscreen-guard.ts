import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  /** Guard hanya diaktifkan saat attempt benar-benar berjalan. */
  enabled: boolean;
  onViolation: (count: number) => void;
};

/**
 * Fullscreen Guard.
 * URUTAN WAJIB: minta fullscreen → fullscreen SUKSES → guard baru aktif.
 * Selama proses meminta fullscreen (atau bila browser menolak/tidak mendukung),
 * TIDAK ada violation yang dihitung.
 */
export function useFullscreenGuard({ enabled, onViolation }: Options) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  /** Guard aktif hanya setelah pernah benar-benar masuk fullscreen. */
  const [isArmed, setIsArmed] = useState(false);
  /** Browser tidak mendukung / menolak fullscreen → tampilkan dialog, bukan violation. */
  const [isUnsupported, setIsUnsupported] = useState(false);
  const localCount = useRef(0);
  const armedRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

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
        // Fullscreen sukses → baru sekarang guard boleh menghitung.
        setIsUnsupported(false);
        if (!armedRef.current) {
          armedRef.current = true;
          setIsArmed(true);
        }
        return;
      }
      if (armedRef.current && enabledRef.current) {
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

  return { isFullscreen, isArmed, isUnsupported, requestFullscreen, exitFullscreen };
}
