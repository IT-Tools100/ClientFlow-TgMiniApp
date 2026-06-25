import { DEMO_USER_ID } from "@/lib/supabase";
import { numericValue, requireSupabaseClient, throwSupabaseError } from "@/lib/services/shared";
import type { Client, ClientStatus } from "@/types";
import type { ClientRow } from "@/types/database";

export interface ClientUpsertInput {
  name: string;
  contact: string;
  source: string;
  status: ClientStatus;
  value: number;
  notes: string;
}

const clientStatuses = new Set<ClientStatus>([
  "New",
  "Contacted",
  "In Progress",
  "Waiting Payment",
  "Paid",
  "Lost"
]);

function normalizeStatus(value: string | null | undefined): ClientStatus {
  return value && clientStatuses.has(value as ClientStatus) ? (value as ClientStatus) : "New";
}

function mapRowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact ?? "",
    source: row.source ?? "",
    status: normalizeStatus(row.status),
    value: numericValue(row.value),
    notes: row.notes ?? "",
    createdAt: row.created_at
  };
}

export async function getClients(): Promise<Client[]> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .order("created_at", { ascending: false });

    if (error || !data) {
      throwSupabaseError("clients", "select", error);
    }

    return data.map(mapRowToClient);
  } catch (error) {
    throwSupabaseError("clients", "select", error);
  }
}

export async function createClient(input: ClientUpsertInput): Promise<Client> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: DEMO_USER_ID,
        name: input.name.trim(),
        contact: input.contact.trim(),
        source: input.source.trim(),
        status: input.status,
        value: numericValue(input.value),
        notes: input.notes.trim()
      })
      .select("*")
      .single();

    if (error || !data) {
      throwSupabaseError("clients", "insert", error);
    }

    return mapRowToClient(data);
  } catch (error) {
    throwSupabaseError("clients", "insert", error);
  }
}

export async function updateClient(
  id: string,
  input: ClientUpsertInput
): Promise<Client> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("clients")
      .update({
        name: input.name.trim(),
        contact: input.contact.trim(),
        source: input.source.trim(),
        status: input.status,
        value: numericValue(input.value),
        notes: input.notes.trim()
      })
      .eq("id", id)
      .eq("user_id", DEMO_USER_ID)
      .select("*")
      .single();

    if (error || !data) {
      throwSupabaseError("clients", "update", error);
    }

    return mapRowToClient(data);
  } catch (error) {
    throwSupabaseError("clients", "update", error);
  }
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = requireSupabaseClient();

  try {
    const { error } = await supabase.from("clients").delete().eq("id", id).eq("user_id", DEMO_USER_ID);

    if (error) {
      throwSupabaseError("clients", "delete", error);
    }
  } catch (error) {
    throwSupabaseError("clients", "delete", error);
  }
}
