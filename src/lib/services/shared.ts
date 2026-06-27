import { getSupabaseClient } from "@/lib/supabase";

export function requireSupabaseClient() {
  return getSupabaseClient();
}

export function nullableUuid(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function resolveProfileClientId(profileId: string, clientId: string | null | undefined) {
  const normalizedClientId = nullableUuid(clientId);
  if (!normalizedClientId) {
    return null;
  }

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .eq("id", normalizedClientId)
    .eq("user_id", profileId)
    .maybeSingle();

  if (error) {
    throwSupabaseError("clients", "validate ownership", error);
  }

  return data?.id ?? null;
}

export function numericValue(value: number | string | null | undefined) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : 0;
}

export function clampPercent(value: number | string | null | undefined) {
  return Math.min(100, Math.max(0, numericValue(value)));
}

export function throwSupabaseError(scope: string, action: string, error: unknown): never {
  console.error(`[${scope}] ${action} failed`, error);

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(`${scope} ${action} failed`);
}
