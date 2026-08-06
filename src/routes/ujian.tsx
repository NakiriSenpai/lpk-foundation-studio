import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
import { AppLayout } from "@/layouts/app-layout";

export const Route = createFileRoute("/ujian")({
  head: () => ({
    meta: [
      { title: "Ujian — LPK Learning" },
      { name: "description", content: "Ujian daring untuk peserta pelatihan." },
      { property: "og:title", content: "Ujian — LPK Learning" },
      { property: "og:description", content: "Ujian daring untuk peserta pelatihan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UjianPage,
});

function UjianPage() {
  return (
    <AppLayout>
      <PagePlaceholder title="Ujian" description="Daftar dan pelaksanaan ujian." />
    </AppLayout>
  );
}
