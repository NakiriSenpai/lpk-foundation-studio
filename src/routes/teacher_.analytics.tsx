import { createFileRoute } from "@tanstack/react-router";

import { LoadingScreen } from "@/components/common/loading-screen";
import { TeacherAnalyticsDashboard } from "@/features/teacher-analytics/components/teacher-analytics-dashboard";
import { useAuth } from "@/hooks/auth";
import { AppLayout } from "@/layouts/app-layout";
import { RequireAuth } from "@/middleware";

export const Route = createFileRoute("/teacher_/analytics")({
  head: () => ({
    meta: [
      { title: "Analitik Pengajar — LPK Learning" },
      { name: "description", content: "Analisis performa ujian siswa untuk pengajar LPK." },
      { property: "og:title", content: "Analitik Pengajar — LPK Learning" },
      { property: "og:description", content: "Analisis performa ujian siswa untuk pengajar LPK." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeacherAnalyticsPage,
});

/** Analytics hanya untuk staf (guru, admin, owner). Siswa ditolak. */
function StaffOnly() {
  const { isLoading, profile } = useAuth();
  if (isLoading) return <LoadingScreen label="Memeriksa akses…" />;
  if (!profile || profile.role === "siswa") {
    return (
      <div className="space-y-2 rounded-lg border border-border p-6 text-center">
        <h1 className="text-lg font-semibold">Akses ditolak</h1>
        <p className="text-sm text-muted-foreground">
          Halaman ini hanya untuk pengajar, admin, dan owner.
        </p>
      </div>
    );
  }
  return <TeacherAnalyticsDashboard />;
}

function TeacherAnalyticsPage() {
  return (
    <AppLayout>
      <RequireAuth>
        <StaffOnly />
      </RequireAuth>
    </AppLayout>
  );
}
