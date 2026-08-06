import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";
import type { AuthUser, LoginCredentials } from "@/types/auth";
import { readRole } from "@/types/auth";

/** Ubah pesan error Supabase menjadi Bahasa Indonesia. */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email atau kata sandi salah.";
  if (m.includes("email not confirmed")) return "Email belum dikonfirmasi.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
  if (m.includes("failed to fetch") || m.includes("network"))
    return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  return "Gagal masuk. Silakan coba lagi.";
}

export function toAuthUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    role: readRole(session.user),
  };
}

export async function signInWithPassword({ email, password }: LoginCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(translateAuthError(error.message));
  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Gagal keluar. Silakan coba lagi.");
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}
