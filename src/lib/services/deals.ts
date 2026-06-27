import {
  clampPercent,
  numericValue,
  requireSupabaseClient,
  resolveProfileClientId,
  throwSupabaseError
} from "@/lib/services/shared";
import type { Deal, DealStatus } from "@/types";
import type { DealRow } from "@/types/database";

export interface DealUpsertInput {
  clientId: string;
  title: string;
  amount: number;
  status: DealStatus;
  probability: number;
}

const dealStatuses = new Set<DealStatus>(["New", "Negotiation", "Waiting Payment", "Paid", "Lost"]);

function normalizeStatus(value: string | null | undefined): DealStatus {
  return value && dealStatuses.has(value as DealStatus) ? (value as DealStatus) : "New";
}

function mapRowToDeal(row: DealRow): Deal {
  return {
    id: row.id,
    clientId: row.client_id ?? "",
    title: row.title,
    amount: numericValue(row.amount),
    status: normalizeStatus(row.status),
    probability: clampPercent(row.probability),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getDeals(profileId: string): Promise<Deal[]> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      throwSupabaseError("deals", "select", error);
    }

    return data.map(mapRowToDeal);
  } catch (error) {
    throwSupabaseError("deals", "select", error);
  }
}

export async function createDeal(profileId: string, input: DealUpsertInput): Promise<Deal> {
  const supabase = requireSupabaseClient();

  try {
    const clientId = await resolveProfileClientId(profileId, input.clientId);

    const { data, error } = await supabase
      .from("deals")
      .insert({
        user_id: profileId,
        client_id: clientId,
        title: input.title.trim(),
        amount: numericValue(input.amount),
        status: input.status,
        probability: clampPercent(input.probability)
      })
      .select("*")
      .single();

    if (error || !data) {
      throwSupabaseError("deals", "insert", error);
    }

    return mapRowToDeal(data);
  } catch (error) {
    throwSupabaseError("deals", "insert", error);
  }
}

export async function updateDeal(
  profileId: string,
  id: string,
  input: DealUpsertInput
): Promise<Deal> {
  const supabase = requireSupabaseClient();

  try {
    const clientId = await resolveProfileClientId(profileId, input.clientId);

    const { data, error } = await supabase
      .from("deals")
      .update({
        client_id: clientId,
        title: input.title.trim(),
        amount: numericValue(input.amount),
        status: input.status,
        probability: clampPercent(input.probability)
      })
      .eq("id", id)
      .eq("user_id", profileId)
      .select("*")
      .single();

    if (error || !data) {
      throwSupabaseError("deals", "update", error);
    }

    return mapRowToDeal(data);
  } catch (error) {
    throwSupabaseError("deals", "update", error);
  }
}

export async function deleteDeal(profileId: string, id: string): Promise<void> {
  const supabase = requireSupabaseClient();

  try {
    const { error } = await supabase.from("deals").delete().eq("id", id).eq("user_id", profileId);

    if (error) {
      throwSupabaseError("deals", "delete", error);
    }
  } catch (error) {
    throwSupabaseError("deals", "delete", error);
  }
}
