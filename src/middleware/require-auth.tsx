import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";

import { LoadingScreen } from "@/components/common/loading-screen";
import { useAuth } from "@/hooks/auth";
import type { AppRole } from "@/types/auth";
import { ROLE_LABELS } from "@/types/auth";

/**
 * Guard sesi. Semua route selain "/" dan "/login" dibungkus komponen ini.
 * Sesi Supabase tersimpan di browser, sehingga pemeriksaan dilakukan di klien.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Simpan tujuan awal agar tidak tertimpa saat proses pengalihan berlangsung.
  const intended = useRef(pathname);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/login", search: { redirect: intended.current }, replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) return <LoadingScreen label="Memeriksa sesi…" />;
  if (!isAuthenticated) return <LoadingScreen label="Mengalihkan ke halaman masuk…" />;

  return <>{children}</>;
}

/** Guard berbasis role. Struktur disiapkan, belum dipakai pada sprint ini. */
export function RequireRole({ role, children }: { role: AppRole; children: ReactNode }) {
  const { isLoading, hasRole } = useAuth();

  return (
    <RequireAuth>
      {isLoading ? (
        <LoadingScreen label="Memeriksa akses…" />
      ) : hasRole(role) ? (
        <>{children}</>
      ) : (
        <div className="space-y-2 rounded-lg border border-border p-6 text-center">
          <h1 className="text-lg font-semibold">Akses ditolak</h1>
          <p className="text-sm text-muted-foreground">
            Halaman ini hanya untuk {ROLE_LABELS[role]}.
          </p>
        </div>
      )}
    </RequireAuth>
  );
}

export const RequireOwner = ({ children }: { children: ReactNode }) => (
  <RequireRole role="owner">{children}</RequireRole>
);
export const RequireAdmin = ({ children }: { children: ReactNode }) => (
  <RequireRole role="admin">{children}</RequireRole>
);
export const RequireGuru = ({ children }: { children: ReactNode }) => (
  <RequireRole role="guru">{children}</RequireRole>
);
export const RequireSiswa = ({ children }: { children: ReactNode }) => (
  <RequireRole role="siswa">{children}</RequireRole>
);
