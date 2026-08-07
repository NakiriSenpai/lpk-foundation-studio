import { createFileRoute } from "@tanstack/react-router";

import { ExamResult } from "@/features/exam-engine/components/exam-result";

export const Route = createFileRoute("/ujian/hasil/$attemptId")({
  head: () => ({
    meta: [
      { title: "Hasil Ujian — LPK Learning" },
      { name: "description", content: "Nilai, status kelulusan, dan ringkasan hasil ujian Anda." },
      { property: "og:title", content: "Hasil Ujian — LPK Learning" },
      {
        property: "og:description",
        content: "Nilai, status kelulusan, dan ringkasan hasil ujian Anda.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HasilUjianPage,
});

function HasilUjianPage() {
  const { attemptId } = Route.useParams();
  return <ExamResult attemptId={attemptId} />;
}
