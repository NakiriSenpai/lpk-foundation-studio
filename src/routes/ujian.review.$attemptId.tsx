import { createFileRoute } from "@tanstack/react-router";

import { ExamReview } from "@/features/exam-engine/components/exam-review";

export const Route = createFileRoute("/ujian/review/$attemptId")({
  head: () => ({
    meta: [
      { title: "Review Ujian — LPK Learning" },
      { name: "description", content: "Tinjau soal, jawaban benar, dan pembahasan ujian Anda." },
      { property: "og:title", content: "Review Ujian — LPK Learning" },
      {
        property: "og:description",
        content: "Tinjau soal, jawaban benar, dan pembahasan ujian Anda.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewUjianPage,
});

function ReviewUjianPage() {
  const { attemptId } = Route.useParams();
  return <ExamReview attemptId={attemptId} />;
}
