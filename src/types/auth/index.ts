import type { Session, User } from "@supabase/supabase-js";

/** Daftar role aplikasi. Mudah dikembangkan pada sprint berikutnya. */
export const APP_ROLES = ["owner", "admin", "guru", "siswa"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  owner: "Pemilik",
  admin: "Admin",
  guru: "Guru",
  siswa: "Siswa",
};

/** Urutan hak akses, angka lebih besar = wewenang lebih tinggi. */
export const ROLE_RANK: Record<AppRole, number> = {
  siswa: 1,
  guru: 2,
  admin: 3,
  owner: 4,
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

/** Role dibaca dari metadata Supabase Auth (belum ada tabel aplikasi). */
export function readRole(user: User | null): AppRole | null {
  if (!user) return null;
  const meta = { ...(user.app_metadata ?? {}), ...(user.user_metadata ?? {}) } as Record<
    string,
    unknown
  >;
  return isAppRole(meta["role"]) ? meta["role"] : null;
}

export type AuthUser = {
  id: string;
  email: string | null;
  role: AppRole | null;
};

export type AuthState = {
  user: AuthUser | null;
  session: Session | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export type LoginCredentials = {
  email: string;
  password: string;
};
