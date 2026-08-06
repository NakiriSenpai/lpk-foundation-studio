import { supabase } from "@/lib/supabase/client";
import type { TenantRow } from "@/types/database";
import { TABLES } from "@/types/database";

const COLUMNS = "id, name, slug, logo_url, is_active, created_at, updated_at";

/** Ambil tenant berdasarkan id. */
export async function getTenantById(tenantId: string): Promise<TenantRow | null> {
  const { data, error } = await supabase
    .from(TABLES.tenants)
    .select(COLUMNS)
    .eq("id", tenantId)
    .maybeSingle();

  if (error) throw new Error("Gagal memuat data lembaga.");
  return (data as TenantRow | null) ?? null;
}

/** Ambil tenant berdasarkan slug. */
export async function getTenantBySlug(slug: string): Promise<TenantRow | null> {
  const { data, error } = await supabase
    .from(TABLES.tenants)
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error("Gagal memuat data lembaga.");
  return (data as TenantRow | null) ?? null;
}
