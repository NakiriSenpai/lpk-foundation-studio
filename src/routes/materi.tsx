import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { LessonViewer } from "@/features/lesson/components/lesson-viewer";
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
          <LessonViewer
            lessonId={lesson}
            onBack={() => void navigate({ to: "/materi", search: {} })}
          />
        ) : (

          <MateriList
            onOpen={(lessonId) => void navigate({ to: "/materi", search: { lesson: lessonId } })}
          />
        )}
      </RequireAuth>
    </AppLayout>
  );
}
