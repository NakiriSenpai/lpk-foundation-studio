import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Audio sederhana: hanya tombol Play/Pause.
 * Tanpa timeline, tanpa menu tiga titik, tanpa unduhan.
 * Dipakai pada Review dan pilihan jawaban agar konsisten dengan halaman ujian.
 */
export function SimpleAudio({ src, label = "Putar audio" }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setPlaying(false);
  }, [src]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant={playing ? "secondary" : "outline"}
        className="size-10 shrink-0 rounded-full"
        onClick={toggle}
        aria-label={playing ? "Jeda audio" : label}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </Button>
      <span className="text-xs text-muted-foreground">{playing ? "Diputar" : label}</span>
      <audio
        ref={audioRef}
        src={src}
        preload="none"
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </span>
  );
}
