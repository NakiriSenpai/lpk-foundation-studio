import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
import { AppLayout } from "@/layouts/app-layout";
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
        <PagePlaceholder title="Admin" description="Panel administrasi lembaga." />
      </RequireAuth>
    </AppLayout>
  );
}
