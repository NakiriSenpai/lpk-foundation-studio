import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
import { AppLayout } from "@/layouts/app-layout";
import { RequireAuth } from "@/middleware";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Peringkat — LPK Learning" },
      { name: "description", content: "Papan peringkat peserta pelatihan." },
      { property: "og:title", content: "Peringkat — LPK Learning" },
      { property: "og:description", content: "Papan peringkat peserta pelatihan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  return (
    <AppLayout>
      <RequireAuth>
        <PagePlaceholder title="Peringkat" description="Papan peringkat peserta." />
      </RequireAuth>
    </AppLayout>
  );
}
