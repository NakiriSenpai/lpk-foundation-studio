import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Loader2, Play } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Audio Manager global (Sprint 11).
 * - Hanya SATU audio aktif pada satu waktu.
 * - Mode ujian: audio otomatis diulang satu kali lalu terkunci permanen.
 *   Status terkunci disimpan per attempt sehingga tetap terkunci setelah refresh.
 * - Mode review: audio bebas diputar ulang, tetap satu audio aktif.
 * - UI hanya tombol ▶ dan spinner. Tanpa counter, durasi, timeline, atau pesan.
 */
type AudioContextValue = {
  playingKey: string | null;
  busy: boolean;
  isLocked: (key: string) => boolean;
  play: (key: string, src: string) => void;
};

const AudioManagerContext = createContext<AudioContextValue | null>(null);

const storageKey = (attemptId: string) => `lpk.audio-locked.${attemptId}`;

function readLocked(attemptId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(attemptId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function AudioManagerProvider({
  attemptId,
  lockAfterPlay,
  children,
}: {
  attemptId: string;
  /** true pada Exam (sekali putar + repeat 1x lalu terkunci), false pada Review. */
  lockAfterPlay: boolean;
  children: ReactNode;
}) {
  const elementRef = useRef<HTMLAudioElement | null>(null);
  const roundRef = useRef(0);
  const currentKey = useRef<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [locked, setLocked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLocked(lockAfterPlay ? new Set(readLocked(attemptId)) : new Set());
  }, [attemptId, lockAfterPlay]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    elementRef.current = audio;
    return () => {
      audio.pause();
      elementRef.current = null;
    };
  }, []);

  const stop = useCallback(
    (lockKey: string | null) => {
      currentKey.current = null;
      roundRef.current = 0;
      setPlayingKey(null);
      if (lockKey && lockAfterPlay) {
        setLocked((prev) => {
          if (prev.has(lockKey)) return prev;
          const next = new Set(prev);
          next.add(lockKey);
          try {
            window.localStorage.setItem(storageKey(attemptId), JSON.stringify(Array.from(next)));
          } catch {
            /* penyimpanan penuh — kunci tetap berlaku selama sesi */
          }
          return next;
        });
      }
    },
    [attemptId, lockAfterPlay],
  );

  useEffect(() => {
    const audio = elementRef.current;
    if (!audio) return;
    const onEnded = () => {
      const key = currentKey.current;
      if (lockAfterPlay && roundRef.current === 1) {
        roundRef.current = 2;
        audio.currentTime = 0;
        void audio.play().catch(() => stop(key));
        return;
      }
      stop(key);
    };
    const onError = () => stop(currentKey.current);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [lockAfterPlay, stop]);

  const play = useCallback(
    (key: string, src: string) => {
      const audio = elementRef.current;
      if (!audio) return;
      if (currentKey.current) return; // satu audio aktif saja
      if (lockAfterPlay && locked.has(key)) return;
      currentKey.current = key;
      roundRef.current = 1;
      setPlayingKey(key);
      audio.src = src;
      audio.currentTime = 0;
      void audio.play().catch(() => stop(key));
    },
    [locked, lockAfterPlay, stop],
  );

  const value = useMemo<AudioContextValue>(
    () => ({
      playingKey,
      busy: playingKey !== null,
      isLocked: (key: string) => lockAfterPlay && locked.has(key),
      play,
    }),
    [playingKey, locked, lockAfterPlay, play],
  );

  return <AudioManagerContext.Provider value={value}>{children}</AudioManagerContext.Provider>;
}

export function useAudioManager(): AudioContextValue {
  const ctx = useContext(AudioManagerContext);
  if (!ctx) throw new Error("useAudioManager harus dipakai di dalam AudioManagerProvider");
  return ctx;
}

/** Tombol audio minimalis: ▶ atau spinner saat berjalan. */
export function AudioButton({
  audioKey,
  src,
  label = "Putar audio",
  size = "default",
}: {
  audioKey: string;
  src: string;
  label?: string;
  size?: "default" | "sm";
}) {
  const { play, playingKey, isLocked, busy } = useAudioManager();
  const isPlaying = playingKey === audioKey;
  const disabled = isLocked(audioKey) || (busy && !isPlaying);

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || isPlaying}
      onClick={() => play(audioKey, src)}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border transition",
        "border-border bg-muted/60 text-foreground hover:bg-muted",
        "disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" ? "size-8" : "size-10",
      )}
    >
      {isPlaying ? (
        <Loader2 className={cn("animate-spin", size === "sm" ? "size-4" : "size-5")} />
      ) : (
        <Play className={cn("fill-current", size === "sm" ? "size-3.5" : "size-4")} />
      )}
    </button>
  );
}
