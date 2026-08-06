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
      <RequireAuth>
        <PagePlaceholder title="Pemilik" description="Panel pemilik lembaga." />
      </RequireAuth>
    </AppLayout>
  );
}
