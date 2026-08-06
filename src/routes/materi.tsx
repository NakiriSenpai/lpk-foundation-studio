import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
import { AppLayout } from "@/layouts/app-layout";

export const Route = createFileRoute("/materi")({
  head: () => ({
    meta: [
      { title: "Materi — LPK Learning" },
      { name: "description", content: "Materi pembelajaran LPK Learning." },
      { property: "og:title", content: "Materi — LPK Learning" },
      { property: "og:description", content: "Materi pembelajaran LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MateriPage,
});

function MateriPage() {
  return (
    <AppLayout>
      <PagePlaceholder title="Materi" description="Kumpulan materi pembelajaran." />
    </AppLayout>
  );
}
