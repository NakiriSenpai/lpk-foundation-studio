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

/**
 * Tombol audio premium (Sprint 11 FINAL).
 * Tanpa player native, tanpa durasi/timeline/counter/teks status.
 * State: idle (▶) → playing (waveform animasi + glow) → locked (✓).
 */
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
  const lockedState = isLocked(audioKey);
  const disabled = lockedState || (busy && !isPlaying);
  const dimension = size === "sm" ? "size-11" : "size-12";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || isPlaying}
      onClick={() => play(audioKey, src)}
      className={cn(
        "group relative inline-flex shrink-0 items-center justify-center rounded-full border transition-all duration-200",
        dimension,
        lockedState
          ? "border-border-subtle bg-surface text-muted-foreground"
          : isPlaying
            ? "border-primary/70 bg-linear-to-br from-primary/35 to-accent/25 text-foreground glow-primary"
            : "border-primary/45 bg-linear-to-br from-primary/25 to-accent/15 text-foreground hover:border-primary hover:from-primary/40 hover:to-accent/25 active:scale-95",
        "disabled:cursor-not-allowed",
        disabled && !lockedState && !isPlaying && "opacity-45",
      )}
    >
      {lockedState ? (
        <Check className="size-4" />
      ) : isPlaying ? (
        <AudioWave />
      ) : (
        <Play className={cn("fill-current", size === "sm" ? "size-4" : "size-4.5")} />
      )}
    </button>
  );
}

/** Waveform sederhana 5 bar. */
function AudioWave() {
  const delays = ["0ms", "120ms", "240ms", "120ms", "0ms"];
  return (
    <span className="flex h-4 items-center gap-[3px]" aria-hidden>
      {delays.map((delay, index) => (
        <span
          key={index}
          className="audio-wave-bar block h-full w-[3px] rounded-full bg-primary-foreground/90"
          style={{ animationDelay: delay }}
        />
      ))}
    </span>
  );
}

