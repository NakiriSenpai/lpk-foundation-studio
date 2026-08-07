import { useCallback, useEffect, useState } from "react";

export type LayoutMode = "portrait" | "landscape";

const KEY_PREFIX = "lpk-exam-layout:";

/** Kunci orientasi layar; fallback diam bila peramban tidak mendukung. */
export async function lockOrientation(mode: LayoutMode) {
  const orientation = (
    globalThis.screen as (Screen & { orientation?: ScreenOrientation }) | undefined
  )?.orientation as (ScreenOrientation & { lock?: (o: string) => Promise<void> }) | undefined;
  if (!orientation || typeof orientation.lock !== "function") return;
  try {
    await orientation.lock(mode === "portrait" ? "portrait" : "landscape");
  } catch {
    /* fallback: hanya layout yang berubah */
  }
}

function read(attemptId: string): LayoutMode {
  if (typeof window === "undefined") return "portrait";
  return window.localStorage.getItem(KEY_PREFIX + attemptId) === "landscape"
    ? "landscape"
    : "portrait";
}

/**
 * Mode tata letak ujian, dipertahankan per attempt (localStorage) sehingga
 * halaman Hasil dan Review mengikuti orientasi terakhir pada halaman ujian.
 */
export function useExamLayout(attemptId: string) {
  const [layout, setLayoutState] = useState<LayoutMode>("portrait");

  // Baca setelah hydrate agar tidak memicu hydration mismatch.
  useEffect(() => {
    setLayoutState(read(attemptId));
  }, [attemptId]);

  const setLayout = useCallback(
    (mode: LayoutMode) => {
      setLayoutState(mode);
      try {
        window.localStorage.setItem(KEY_PREFIX + attemptId, mode);
      } catch {
        /* storage penuh / privat — abaikan */
      }
      void lockOrientation(mode);
    },
    [attemptId],
  );

  return { layout, setLayout, isLandscape: layout === "landscape" };
}
