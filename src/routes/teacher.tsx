import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/layouts/app-layout";
import { RequireAuth } from "@/middleware";

export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [
      { title: "Pengajar — LPK Learning" },
      { name: "description", content: "Area kerja pengajar LPK Learning." },
      { property: "og:title", content: "Pengajar — LPK Learning" },
      { property: "og:description", content: "Area kerja pengajar LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeacherPage,
});

function TeacherPage() {
  return (
    <AppLayout>
      <RequireAuth>
        <div className="space-y-4">
          <header className="space-y-1">
            <h1 className="text-xl font-semibold text-foreground">Pengajar</h1>
            <p className="text-sm text-muted-foreground">Area kerja pengajar.</p>
          </header>

          <Link to="/teacher/analytics" className="block">
            <Card className="transition-colors hover:border-primary/60">
              <CardContent className="flex items-center gap-3 p-4">
                <BarChart3 className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Analitik Pengajar</p>
                  <p className="text-xs text-muted-foreground">
                    Performa siswa, ujian, soal, dan grammar.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </RequireAuth>
    </AppLayout>
  );
}
