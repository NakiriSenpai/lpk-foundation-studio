import { createFileRoute, Link } from "@tanstack/react-router";

import { AppLayout } from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { RequireOwner } from "@/middleware";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Pemilik — LPK Learning" },
      { name: "description", content: "Panel pemilik LPK Learning." },
      { property: "og:title", content: "Pemilik — LPK Learning" },
      { property: "og:description", content: "Panel pemilik LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerPage,
});

function OwnerPage() {
  return (
    <AppLayout>
      <RequireOwner>
        <section className="space-y-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Panel Pemilik</h1>
            <p className="text-sm text-muted-foreground">Kelola lembaga yang terdaftar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="min-h-11">
              <Link to="/owner/tenants">Manajemen Tenant</Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/owner/users">Manajemen User</Link>
            </Button>
          </div>
        </section>
      </RequireOwner>
    </AppLayout>
  );
}
