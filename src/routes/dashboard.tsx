import { createFileRoute } from "@tanstack/react-router";

import { StudentDashboard } from "@/features/dashboard/components/student-dashboard";
import { AppLayout } from "@/layouts/app-layout";
import { RequireAuth } from "@/middleware";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dasbor — LPK Learning" },
      { name: "description", content: "Dasbor peserta LPK Learning." },
      { property: "og:title", content: "Dasbor — LPK Learning" },
      { property: "og:description", content: "Dasbor peserta LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <AppLayout>
      <RequireAuth>
        <StudentDashboard />
      </RequireAuth>
    </AppLayout>
  );
}
