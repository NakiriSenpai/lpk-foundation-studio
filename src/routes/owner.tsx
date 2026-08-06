import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
import { AppLayout } from "@/layouts/app-layout";

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
      <PagePlaceholder title="Pemilik" description="Panel pemilik lembaga." />
    </AppLayout>
  );
}
