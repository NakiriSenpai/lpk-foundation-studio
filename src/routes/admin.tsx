import { createFileRoute, Link } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/middleware";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — LPK Learning" },
      { name: "description", content: "Panel administrasi LPK Learning." },
      { property: "og:title", content: "Admin — LPK Learning" },
      { property: "og:description", content: "Panel administrasi LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <AppLayout>
      <RequireAuth>
        <section className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Panel Admin</h1>
            <p className="text-sm text-muted-foreground">Kelola pengguna pada lembaga Anda.</p>
          </div>
          <Button asChild className="min-h-11">
            <Link to="/admin/users">Manajemen User</Link>
          </Button>
        </section>
      </RequireAuth>
    </AppLayout>
  );
}
