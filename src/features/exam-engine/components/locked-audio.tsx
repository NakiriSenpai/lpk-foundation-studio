import { useEffect, useRef, useState } from "react";
import { Lock, Play, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  /** Kunci global: audio lain sedang diputar. */
  disabled: boolean;
  /** Audio ini sudah pernah diputar pada attempt ini (status dari luar komponen). */
  alreadyPlayed?: boolean;
  onPlayingChange: (playing: boolean) => void;
  onFinished?: () => void;
  label?: string;
  compact?: boolean;
};

/**
 * Audio EPS-TOPIK: sekali tekan Play → diputar, lalu otomatis diulang satu kali,
 * setelah itu selesai dan tidak dapat diputar lagi (status disimpan pada attempt).
 * Selama berjalan seluruh interaksi dikunci oleh runner.
 */
export function LockedAudio({
  src,
  disabled,
  alreadyPlayed = false,
  onPlayingChange,
  onFinished,
  label = "Audio soal",
  compact = false,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [round, setRound] = useState(0);

  useEffect(() => {
    setState("idle");
    setRound(0);
  }, [src]);

  const finished = state === "done" || alreadyPlayed;
  const playing = state === "playing";

  const start = () => {
    const audio = audioRef.current;
    if (!audio || playing || finished || disabled) return;
    setRound(1);
    setState("playing");
    onPlayingChange(true);
    audio.currentTime = 0;
    void audio.play();
  };

  const handleEnded = () => {
    const audio = audioRef.current;
    if (round === 1 && audio) {
      // Repeat otomatis satu kali.
      setRound(2);
      audio.currentTime = 0;
      void audio.play();
      return;
    }
    setState("done");
    onPlayingChange(false);
    onFinished?.();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border bg-muted/40",
        compact ? "p-2" : "p-3",
      )}
    >
      <Button
        type="button"
        size="icon"
        variant={!finished && !playing ? "default" : "secondary"}
        className={cn("shrink-0 rounded-full", compact ? "size-9" : "size-11")}
        onClick={start}
        disabled={disabled || playing || finished}
        aria-label="Putar audio"
      >
        {playing ? (
          <Volume2 className={compact ? "size-4 animate-pulse" : "size-5 animate-pulse"} />
        ) : finished ? (
          <Lock className={compact ? "size-4" : "size-5"} />
        ) : (
          <Play className={compact ? "size-4" : "size-5"} />
        )}
      </Button>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {playing
            ? `Sedang diputar (putaran ${round} dari 2). Semua interaksi terkunci.`
            : finished
              ? "Audio selesai dan tidak dapat diputar ulang."
              : "Sekali putar, otomatis diulang 1 kali."}
        </p>
      </div>
      <audio ref={audioRef} src={src} preload="auto" onEnded={handleEnded} className="hidden" />
    </div>
  );
}
