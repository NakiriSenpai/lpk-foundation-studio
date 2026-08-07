import { useCallback, useEffect, useState } from "react";

/**
 * Landscape Only (Sprint 11). Mode portrait dihapus dari Exam Workspace.
 * Orientasi dikunci lewat Screen Orientation API bila tersedia; bila peramban
 * menolak, Workspace menampilkan permintaan memutar perangkat.
 */
export async function lockLandscape() {
  const orientation = (
    globalThis.screen as (Screen & { orientation?: ScreenOrientation }) | undefined
  )?.orientation as (ScreenOrientation & { lock?: (o: string) => Promise<void> }) | undefined;
  if (!orientation || typeof orientation.lock !== "function") return false;
  try {
    await orientation.lock("landscape");
    return true;
  } catch {
    return false;
  }
}

/** Memantau apakah viewport sudah landscape (coarse pointer / layar kecil saja). */
export function useLandscapeLock() {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    void lockLandscape();
    const query = window.matchMedia("(orientation: portrait) and (max-width: 900px)");
    const sync = () => setIsPortrait(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const retry = useCallback(() => {
    void lockLandscape();
  }, []);

  return { isPortrait, retry };
}
