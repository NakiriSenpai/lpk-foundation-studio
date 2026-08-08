import type { AppRole } from "@/types/auth";

/** Landing page utama per role (dipakai login redirect & tombol kembali). */
export const ROLE_LANDING: Record<AppRole, string> = {
  owner: "/owner",
  admin: "/admin",
  guru: "/teacher",
  siswa: "/dashboard",
};

export function landingPathFor(role: AppRole | null | undefined): string {
  return role ? ROLE_LANDING[role] : "/dashboard";
}

/** Route yang hanya boleh menjadi tujuan redirect bila cocok dengan role. */
const ROLE_PREFIX: Record<string, readonly AppRole[]> = {
  "/owner": ["owner"],
  "/admin": ["admin"],
  "/teacher": ["owner", "admin", "guru"],
  "/exam-studio": ["owner"],
  "/lesson-studio": ["owner"],
  "/media": ["owner"],
};

/**
 * Cegah "Akses ditolak" sebagai layar pertama: bila tujuan redirect tidak
 * diizinkan untuk role tersebut, arahkan ke landing page role.
 */
export function resolvePostLoginTarget(role: AppRole | null, redirect?: string): string {
  const landing = landingPathFor(role);
  if (!redirect || !redirect.startsWith("/") || redirect === "/login" || redirect === "/") {
    return landing;
  }
  const match = Object.entries(ROLE_PREFIX).find(
    ([prefix]) => redirect === prefix || redirect.startsWith(`${prefix}/`),
  );
  if (match && role && !match[1].includes(role)) return landing;
  return redirect;
}
