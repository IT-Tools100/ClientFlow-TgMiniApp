import { DEMO_USER_ID } from "@/lib/supabase";
import {
  clampPercent,
  nullableUuid,
  numericValue,
  requireSupabaseClient,
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

export async function getDeals(): Promise<Deal[]> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .order("created_at", { ascending: false });

    if (error || !data) {
      throwSupabaseError("deals", "select", error);
    }

    return data.map(mapRowToDeal);
  } catch (error) {
    throwSupabaseError("deals", "select", error);
  }
}

export async function createDeal(input: DealUpsertInput): Promise<Deal> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("deals")
      .insert({
        user_id: DEMO_USER_ID,
        client_id: nullableUuid(input.clientId),
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
  id: string,
  input: DealUpsertInput
): Promise<Deal> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("deals")
      .update({
        client_id: nullableUuid(input.clientId),
        title: input.title.trim(),
        amount: numericValue(input.amount),
        status: input.status,
        probability: clampPercent(input.probability)
      })
      .eq("id", id)
      .eq("user_id", DEMO_USER_ID)
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

export async function deleteDeal(id: string): Promise<void> {
  const supabase = requireSupabaseClient();

  try {
    const { error } = await supabase.from("deals").delete().eq("id", id).eq("user_id", DEMO_USER_ID);

    if (error) {
      throwSupabaseError("deals", "delete", error);
    }
  } catch (error) {
    throwSupabaseError("deals", "delete", error);
  }
}
