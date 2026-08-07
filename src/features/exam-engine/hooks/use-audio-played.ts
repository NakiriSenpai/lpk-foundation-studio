import { useCallback, useEffect, useState } from "react";

/**
 * Status "audio sudah diputar" per Attempt (Sprint 10D — BUG 3).
 * Disimpan pada penyimpanan sesi milik attempt (bukan state komponen),
 * sehingga pindah soal atau refresh tidak mengembalikan audio ke keadaan idle.
 * Tidak mengubah database maupun snapshot.
 */
const prefix = (attemptId: string) => `lpk.audio-played.${attemptId}`;

function read(attemptId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(prefix(attemptId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function useAudioPlayed(attemptId: string) {
  const [played, setPlayed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPlayed(new Set(read(attemptId)));
  }, [attemptId]);

  const markPlayed = useCallback(
    (key: string) => {
      setPlayed((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        try {
          window.localStorage.setItem(prefix(attemptId), JSON.stringify(Array.from(next)));
        } catch {
          /* storage penuh / diblokir — status tetap berlaku selama sesi */
        }
        return next;
      });
    },
    [attemptId],
  );

  const hasPlayed = useCallback((key: string) => played.has(key), [played]);

  return { hasPlayed, markPlayed };
}
