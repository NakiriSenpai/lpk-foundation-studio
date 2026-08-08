import { Link } from "@tanstack/react-router";
import { BarChart3, RefreshCw, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsOverview } from "@/hooks/analytics";
import { useAuth } from "@/hooks/auth";
import { useTenantUserStats } from "@/hooks/users";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">Gagal memuat data.</p>
        <Button variant="outline" className="min-h-11" onClick={onRetry}>
          <RefreshCw className="mr-2 size-4" />
          Coba Lagi
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard operasional Admin Tenant (Sprint 14).
 * Hanya ringkasan user & performa ujian pada tenant sendiri — tanpa fitur konten.
 */
export function AdminDashboard() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id ?? null;
  const users = useTenantUserStats(tenantId);
  const overview = useAnalyticsOverview({ range: "30" });

  const isLoading = users.isLoading || overview.isLoading;
  const isError = users.isError || overview.isError;
  const retry = () => {
    void users.refetch();
    void overview.refetch();
  };

  const kosong =
    !isLoading &&
    !isError &&
    (users.data?.total ?? 0) === 0 &&
    (overview.data?.total_attempts ?? 0) === 0;

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Panel Admin</h1>
        <p className="text-sm text-muted-foreground">
          Operasional pengguna dan performa ujian pada lembaga Anda.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="min-h-11">
          <Link to="/admin/users">
            <Users className="mr-2 size-4" />
            Manajemen User
          </Link>
        </Button>
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/admin/analytics">
            <BarChart3 className="mr-2 size-4" />
            Analitik Tenant
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <StatsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={retry} />
      ) : kosong ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Belum ada aktivitas.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat label="Total User" value={users.data?.total ?? 0} />
            <Stat label="Total Guru" value={users.data?.guru ?? 0} />
            <Stat label="Total Siswa" value={users.data?.siswa ?? 0} />
            <Stat label="User Aktif" value={users.data?.aktif ?? 0} />
            <Stat label="User Nonaktif" value={users.data?.nonaktif ?? 0} />
            <Stat label="Siswa Aktif (30 hari)" value={overview.data?.active_students ?? 0} />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Stat label="Ujian Selesai" value={overview.data?.total_attempts ?? 0} />
            <Stat label="Rata-rata Nilai" value={Math.round(overview.data?.average_score ?? 0)} />
            <Stat label="Tingkat Lulus" value={`${Math.round(overview.data?.pass_rate ?? 0)}%`} />
          </div>
        </div>
      )}
    </section>
  );
}
