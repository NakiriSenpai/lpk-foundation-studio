import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "@/components/common/page-placeholder";
import { AppLayout } from "@/layouts/app-layout";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk — LPK Learning" },
      { name: "description", content: "Masuk ke akun LPK Learning." },
      { property: "og:title", content: "Masuk — LPK Learning" },
      { property: "og:description", content: "Masuk ke akun LPK Learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <AppLayout>
      <PagePlaceholder title="Masuk" description="Halaman masuk pengguna." />
    </AppLayout>
  );
}
