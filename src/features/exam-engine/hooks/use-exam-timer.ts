import { useEffect, useState } from "react";

/** Sisa waktu dihitung dari `expires_at` server, sehingga tahan refresh browser. */
export function useExamTimer(expiresAt: string | undefined, active: boolean) {
  const [remaining, setRemaining] = useState(() => computeRemaining(expiresAt));

  useEffect(() => {
    setRemaining(computeRemaining(expiresAt));
    if (!active || !expiresAt) return;
    const id = window.setInterval(() => setRemaining(computeRemaining(expiresAt)), 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, active]);

  return { remaining, isExpired: remaining <= 0, label: formatRemaining(remaining) };
}

function computeRemaining(expiresAt: string | undefined): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function formatRemaining(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}
