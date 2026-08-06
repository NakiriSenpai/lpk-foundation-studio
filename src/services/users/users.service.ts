import { supabase } from "@/lib/supabase/client";
import type { ProfileRow } from "@/types/database";
import { TABLES } from "@/types/database";
import type { AppRole } from "@/types/auth";
import {
  createUserAccount,
  resetUserPassword as resetUserPasswordFn,
  setUserStatus as setUserStatusFn,
  updateUserAccount,
  type CreateUserPayload,
  type ResetUserPasswordPayload,
  type SetUserStatusPayload,
  type UpdateUserPayload,
} from "@/lib/users/users.functions";

export type {
  CreateUserPayload,
  UpdateUserPayload,
  SetUserStatusPayload,
  ResetUserPasswordPayload,
};

const COLUMNS =
  "id, tenant_id, role, email, full_name, display_name, username, avatar_url, is_active, created_by, last_login_at, created_at, updated_at";

export type UserStatusFilter = "semua" | "aktif" | "nonaktif";
export type UserRoleFilter = "semua" | AppRole;

export type UserListParams = {
  search?: string;
  role?: UserRoleFilter;
  status?: UserStatusFilter;
  tenantId?: string | null;
  page?: number;
  pageSize?: number;
};

export type UserListResult = {
  rows: ProfileRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Daftar user dengan pencarian, filter role/status, dan pagination. */
export async function listUsers({
  search = "",
  role = "semua",
  status = "semua",
  tenantId = null,
  page = 1,
  pageSize = 10,
}: UserListParams = {}): Promise<UserListResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(TABLES.profiles)
    .select(COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const term = search.trim();
  if (term) {
    const safe = term.replace(/[%,()]/g, "");
    query = query.or(
      `full_name.ilike.%${safe}%,display_name.ilike.%${safe}%,username.ilike.%${safe}%,email.ilike.%${safe}%`,
    );
  }
  if (role !== "semua") query = query.eq("role", role);
  if (status !== "semua") query = query.eq("is_active", status === "aktif");
  if (tenantId) query = query.eq("tenant_id", tenantId);

  const { data, error, count } = await query;
  if (error) throw new Error("Gagal memuat daftar user.");

  const total = count ?? 0;
  return {
    rows: (data as ProfileRow[] | null) ?? [],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createUser(payload: CreateUserPayload) {
  return createUserAccount({ data: payload });
}

export async function updateUser(payload: UpdateUserPayload) {
  return updateUserAccount({ data: payload });
}

export async function setUserActive(payload: SetUserStatusPayload) {
  return setUserStatusFn({ data: payload });
}

export async function resetPassword(payload: ResetUserPasswordPayload) {
  return resetUserPasswordFn({ data: payload });
}
