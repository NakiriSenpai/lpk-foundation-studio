import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  BookOpen,
  FileSpreadsheet,
  Image as ImageIcon,
  Library,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { RequireOwner } from "@/middleware";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner Control Center — LPK Learning" },
      { name: "description", content: "Pusat pengelolaan platform LPK Learning untuk pemilik." },
      { property: "og:title", content: "Owner Control Center — LPK Learning" },
      {
        property: "og:description",
        content: "Pusat pengelolaan platform LPK Learning untuk pemilik.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerPage,
});

type Item = { to: string; label: string; description: string; icon: LucideIcon };
type Group = { title: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "Management",
    items: [
      {
        to: "/owner/tenants",
        label: "Manajemen Tenant",
        description: "Lembaga, status aktif, dan admin pertama.",
        icon: Building2,
      },
      {
        to: "/owner/users",
        label: "Manajemen User",
        description: "Seluruh pengguna pada semua tenant.",
        icon: Users,
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        to: "/owner/exam-studio",
        label: "Exam Studio",
        description: "Susun ujian, section, dan soal.",
        icon: FileSpreadsheet,
      },
      {
        to: "/owner/lesson-studio",
        label: "Lesson Studio",
        description: "CMS materi pembelajaran.",
        icon: BookOpen,
      },
      {
        to: "/owner/question-bank",
        label: "Question Bank",
        description: "Library soal untuk Exam dan Lesson.",
        icon: Library,
      },
    ],
  },
  {
    title: "Media",
    items: [
      {
        to: "/media",
        label: "Media",
        description: "Unggah gambar dan audio terpusat.",
        icon: ImageIcon,
      },
    ],
  },
  {
    title: "Data",
    items: [
      {
        to: "/teacher/analytics",
        label: "Analytics",
        description: "Performa siswa, ujian, dan soal.",
        icon: BarChart3,
      },
    ],
  },
];

function OwnerPage() {
  return (
    <AppLayout>
      <RequireOwner>
        <section className="space-y-6">
          <header className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Owner Control Center</h1>
            <p className="text-sm text-muted-foreground">
              Pusat pengelolaan platform: tenant, pengguna, konten, media, dan data.
            </p>
          </header>

          {GROUPS.map((group) => (
            <div key={group.title} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((item) => (
                  <Link key={item.to} to={item.to} className="block">
                    <Card className="h-full transition-colors hover:border-primary/60">
                      <CardContent className="flex items-start gap-3 p-4">
                        <item.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tools
            </h2>
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Import / Export bundle JSON tersedia di dalam Exam Studio, Lesson Studio, dan
                Question Bank (khusus Owner).
              </CardContent>
            </Card>
          </div>
        </section>
      </RequireOwner>
    </AppLayout>
  );
}
