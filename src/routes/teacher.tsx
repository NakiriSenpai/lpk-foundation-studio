import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
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
        <PagePlaceholder title="Pengajar" description="Area kerja pengajar." />
      </RequireAuth>
    </AppLayout>
  );
}
