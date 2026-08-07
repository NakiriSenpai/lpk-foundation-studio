import { useEffect, useRef, useState } from "react";
import { Lock, Play, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  src: string;
  /** Kunci global: audio lain sedang diputar. */
  disabled: boolean;
  onPlayingChange: (playing: boolean) => void;
  label?: string;
};

/**
 * Audio EPS-TOPIK: sekali tekan Play → diputar, lalu otomatis diulang satu kali,
 * setelah itu selesai dan tidak dapat diputar lagi. Selama berjalan seluruh
 * interaksi (next, prev, pilih jawaban, audio lain) dikunci oleh runner.
 */
export function LockedAudio({ src, disabled, onPlayingChange, label = "Audio soal" }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [round, setRound] = useState(0);

  useEffect(() => {
    setState("idle");
    setRound(0);
  }, [src]);

  const start = () => {
    const audio = audioRef.current;
    if (!audio || state !== "idle" || disabled) return;
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
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
      <Button
        type="button"
        size="icon"
        variant={state === "idle" ? "default" : "secondary"}
        className="size-11 shrink-0 rounded-full"
        onClick={start}
        disabled={disabled || state !== "idle"}
        aria-label="Putar audio"
      >
        {state === "idle" ? (
          <Play className="size-5" />
        ) : state === "playing" ? (
          <Volume2 className="size-5 animate-pulse" />
        ) : (
          <Lock className="size-5" />
        )}
      </Button>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          {state === "idle"
            ? "Sekali putar, otomatis diulang 1 kali."
            : state === "playing"
              ? `Sedang diputar (putaran ${round} dari 2). Navigasi terkunci.`
              : "Audio selesai dan tidak dapat diputar ulang."}
        </p>
      </div>
      <audio ref={audioRef} src={src} preload="auto" onEnded={handleEnded} className="hidden" />
    </div>
  );
}
