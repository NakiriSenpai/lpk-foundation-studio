import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { LessonPreview } from "@/features/lesson/components/lesson-preview";
import { MateriList } from "@/features/materi/components/materi-list";
import { AppLayout } from "@/layouts/app-layout";
import { RequireAuth } from "@/middleware";

type MateriSearch = { lesson?: string | undefined };

export const Route = createFileRoute("/materi")({
  validateSearch: (search: Record<string, unknown>): MateriSearch => ({
    lesson: typeof search["lesson"] === "string" ? (search["lesson"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Materi — LPK Learning" },
      { name: "description", content: "Materi pembelajaran LPK Learning yang sudah terbit." },
      { property: "og:title", content: "Materi — LPK Learning" },
      {
        property: "og:description",
        content: "Materi pembelajaran LPK Learning yang sudah terbit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MateriPage,
});

function MateriPage() {
  const navigate = useNavigate();
  const { lesson } = Route.useSearch();

  return (
    <AppLayout>
      <RequireAuth>
        {lesson ? (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2"
              onClick={() => void navigate({ to: "/materi", search: {} })}
            >
              ← Kembali ke daftar materi
            </Button>
            <LessonPreview lessonId={lesson} variant="siswa" />
          </div>
        ) : (
          <MateriList
            onOpen={(lessonId) => void navigate({ to: "/materi", search: { lesson: lessonId } })}
          />
        )}
      </RequireAuth>
    </AppLayout>
  );
}
