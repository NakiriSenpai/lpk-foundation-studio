import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import { ExamRunner } from "@/features/exam-engine/components/exam-runner";

export const Route = createFileRoute("/ujian/$attemptId")({
  head: () => ({
    meta: [
      { title: "Sedang Ujian — LPK Learning" },
      { name: "description", content: "Halaman pengerjaan ujian dengan timer dan auto save." },
      { property: "og:title", content: "Sedang Ujian — LPK Learning" },
      {
        property: "og:description",
        content: "Halaman pengerjaan ujian dengan timer dan auto save.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UjianRunnerPage,
});

function UjianRunnerPage() {
  const { attemptId } = Route.useParams();

  /** BUG 4: matikan copy/cut/seleksi/drag selama ujian, tanpa mengganggu input. */
  useEffect(() => {
    const isEditable = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      return Boolean(el?.closest?.("input, textarea, [contenteditable='true']"));
    };
    const block = (event: Event) => {
      if (isEditable(event.target)) return;
      event.preventDefault();
    };
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("selectstart", block);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("selectstart", block);
    };
  }, []);

  return (
    <div
      className="select-none"
      style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as React.CSSProperties}
    >
      <ExamRunner attemptId={attemptId} />
    </div>
  );
}
