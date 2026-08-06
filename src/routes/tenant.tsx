import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
import { AppLayout } from "@/layouts/app-layout";

export const Route = createFileRoute("/tenant")({
  head: () => ({
    meta: [
      { title: "Tenant — LPK Learning" },
      { name: "description", content: "Manajemen tenant LPK Learning." },
      { property: "og:title", content: "Tenant — LPK Learning" },
      { property: "og:description", content: "Manajemen tenant LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TenantPage,
});

function TenantPage() {
  return (
    <AppLayout>
      <PagePlaceholder title="Tenant" description="Manajemen multi-tenant." />
    </AppLayout>
  );
}
