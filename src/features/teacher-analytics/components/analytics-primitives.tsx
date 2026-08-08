import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold text-foreground">{value}</p>
        {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function MetricBar({
  label,
  value,
  suffix = "%",
  max = 100,
  className,
}: {
  label: string;
  value: number;
  suffix?: string;
  max?: number;
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <Progress value={percent} />
    </div>
  );
}

export function formatDurasiDetik(total: number): string {
  const menit = Math.floor(total / 60);
  const detik = total % 60;
  return `${menit}m ${String(detik).padStart(2, "0")}d`;
}

export function formatTanggal(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}
