import { deals as mockDeals } from "@/data/mockData";
import { DEMO_USER_ID, getSupabaseClient } from "@/lib/supabase";
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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

function normalizeStatus(value: string | null | undefined): DealStatus {
  return value && dealStatuses.has(value as DealStatus) ? (value as DealStatus) : "New";
}

function mapRowToDeal(row: DealRow): Deal {
  return {
    id: row.id,
    clientId: row.client_id ?? "",
    title: row.title,
    amount: Number(row.amount ?? 0),
    status: normalizeStatus(row.status),
    probability: Number(row.probability ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapInputToDeal(input: DealUpsertInput, id = createId("deal"), createdAt = todayIsoDate()): Deal {
  return {
    id,
    clientId: input.clientId,
    title: input.title.trim(),
    amount: Number(input.amount) || 0,
    status: input.status,
    probability: Math.min(100, Math.max(0, Number(input.probability) || 0)),
    createdAt,
    updatedAt: createdAt
  };
}

export async function getDeals(): Promise<Deal[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return mockDeals.map((deal) => ({ ...deal }));
  }

  try {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return mockDeals.map((deal) => ({ ...deal }));
    }

    return data.map(mapRowToDeal);
  } catch {
    return mockDeals.map((deal) => ({ ...deal }));
  }
}

export async function createDeal(input: DealUpsertInput): Promise<Deal> {
  const fallbackDeal = mapInputToDeal(input);
  const supabase = getSupabaseClient();
  if (!supabase) {
    return fallbackDeal;
  }

  try {
    const { data, error } = await supabase
      .from("deals")
      .insert({
        user_id: DEMO_USER_ID,
        client_id: input.clientId,
        title: input.title.trim(),
        amount: Number(input.amount) || 0,
        status: input.status,
        probability: Math.min(100, Math.max(0, Number(input.probability) || 0))
      })
      .select("*")
      .single();

    if (error || !data) {
      return fallbackDeal;
    }

    return mapRowToDeal(data);
  } catch {
    return fallbackDeal;
  }
}

export async function updateDeal(
  id: string,
  input: DealUpsertInput,
  existingDeal?: Deal
): Promise<Deal> {
  const fallbackDeal = mapInputToDeal(input, id, existingDeal?.createdAt ?? todayIsoDate());
  const supabase = getSupabaseClient();
  if (!supabase) {
    return fallbackDeal;
  }

  try {
    const { data, error } = await supabase
      .from("deals")
      .update({
        client_id: input.clientId,
        title: input.title.trim(),
        amount: Number(input.amount) || 0,
        status: input.status,
        probability: Math.min(100, Math.max(0, Number(input.probability) || 0))
      })
      .eq("id", id)
      .eq("user_id", DEMO_USER_ID)
      .select("*")
      .single();

    if (error || !data) {
      return fallbackDeal;
    }

    return mapRowToDeal(data);
  } catch {
    return fallbackDeal;
  }
}

export async function deleteDeal(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  try {
    await supabase.from("deals").delete().eq("id", id).eq("user_id", DEMO_USER_ID);
  } catch {
    return;
  }
}
