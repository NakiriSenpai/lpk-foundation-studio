import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppLayout } from "@/layouts/app-layout";
import { LoginForm } from "@/features/auth/components/login-form";
import { LoadingScreen } from "@/components/common/loading-screen";
import { useAuth } from "@/hooks/auth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = search["redirect"];
    return typeof redirect === "string" && redirect.startsWith("/") ? { redirect } : {};
  },
  head: () => ({
    meta: [
      { title: "Masuk — LPK Learning" },
      { name: "description", content: "Masuk ke akun LPK Learning menggunakan email dan sandi." },
      { property: "og:title", content: "Masuk — LPK Learning" },
      {
        property: "og:description",
        content: "Masuk ke akun LPK Learning menggunakan email dan sandi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const target = redirect && redirect !== "/login" ? redirect : "/dashboard";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void navigate({ to: target, replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, target]);

  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-sm space-y-6 py-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
          <p className="text-sm text-muted-foreground">
            Gunakan email dan kata sandi yang diberikan lembaga Anda.
          </p>
        </div>

        {isLoading ? (
          <LoadingScreen label="Memeriksa sesi…" />
        ) : (
          <LoginForm onSuccess={() => void navigate({ to: target, replace: true })} />
        )}
      </section>
    </AppLayout>
  );
}
