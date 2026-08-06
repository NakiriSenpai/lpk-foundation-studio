import { useQuery } from "@tanstack/react-query";

import { getTenantById } from "@/services/tenant";
import { useAuth } from "@/hooks/auth";

/** Data tenant berdasarkan id. */
export function useTenant(tenantId?: string | null) {
  return useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: () => getTenantById(tenantId as string),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60_000,
  });
}

/** Tenant milik user yang sedang masuk. */
export function useCurrentTenant() {
  const { profile } = useAuth();
  return useTenant(profile?.tenant_id ?? null);
}
