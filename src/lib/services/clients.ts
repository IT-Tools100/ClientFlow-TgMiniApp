import { clients as mockClients } from "@/data/mockData";
import { DEMO_USER_ID, getSupabaseClient } from "@/lib/supabase";
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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

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
    value: Number(row.value ?? 0),
    notes: row.notes ?? "",
    createdAt: row.created_at
  };
}

function mapInputToClient(input: ClientUpsertInput, id = createId("client"), createdAt = todayIsoDate()) {
  return {
    id,
    name: input.name.trim(),
    contact: input.contact.trim(),
    source: input.source.trim(),
    status: input.status,
    value: Number(input.value) || 0,
    notes: input.notes.trim(),
    createdAt
  } satisfies Client;
}

async function fallback<T>(value: T) {
  return value;
}

export async function getClients(): Promise<Client[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.log("[clients] fallback getClients");
    return mockClients.map((client) => ({ ...client }));
  }

  try {
    console.log("[clients] select before", { user_id: DEMO_USER_ID });
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .order("created_at", { ascending: false });

    console.log("[clients] select after", { data, error });

    if (error || !data) {
      console.error("[clients] select failed", error);
      return mockClients.map((client) => ({ ...client }));
    }

    return data.map(mapRowToClient);
  } catch (error) {
    console.error("[clients] select exception", error);
    return mockClients.map((client) => ({ ...client }));
  }
}

export async function createClient(input: ClientUpsertInput): Promise<Client> {
  const fallbackClient = mapInputToClient(input);
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.log("[clients] fallback createClient", fallbackClient);
    return fallback(fallbackClient);
  }

  try {
    console.log("[clients] insert before", {
      user_id: DEMO_USER_ID,
      name: input.name.trim(),
      contact: input.contact.trim(),
      source: input.source.trim(),
      status: input.status,
      value: Number(input.value) || 0,
      notes: input.notes.trim()
    });

    const { data, error } = await supabase
      .from("clients")
      .insert({
        user_id: DEMO_USER_ID,
        name: input.name.trim(),
        contact: input.contact.trim(),
        source: input.source.trim(),
        status: input.status,
        value: Number(input.value) || 0,
        notes: input.notes.trim()
      })
      .select("*")
      .single();

    console.log("[clients] insert after", { data, error });

    if (error || !data) {
      console.error("[clients] insert failed", error);
      return fallbackClient;
    }

    return mapRowToClient(data);
  } catch (error) {
    console.error("[clients] insert exception", error);
    return fallbackClient;
  }
}

export async function updateClient(
  id: string,
  input: ClientUpsertInput,
  existingClient?: Client
): Promise<Client> {
  const fallbackClient = mapInputToClient(input, id, existingClient?.createdAt ?? todayIsoDate());
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.log("[clients] fallback updateClient", { id, fallbackClient });
    return fallback(fallbackClient);
  }

  try {
    console.log("[clients] update before", {
      id,
      user_id: DEMO_USER_ID,
      name: input.name.trim(),
      contact: input.contact.trim(),
      source: input.source.trim(),
      status: input.status,
      value: Number(input.value) || 0,
      notes: input.notes.trim()
    });

    const { data, error } = await supabase
      .from("clients")
      .update({
        name: input.name.trim(),
        contact: input.contact.trim(),
        source: input.source.trim(),
        status: input.status,
        value: Number(input.value) || 0,
        notes: input.notes.trim()
      })
      .eq("id", id)
      .eq("user_id", DEMO_USER_ID)
      .select("*")
      .single();

    console.log("[clients] update after", { data, error });

    if (error || !data) {
      console.error("[clients] update failed", error);
      return fallbackClient;
    }

    return mapRowToClient(data);
  } catch (error) {
    console.error("[clients] update exception", error);
    return fallbackClient;
  }
}

export async function deleteClient(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.log("[clients] fallback deleteClient", { id });
    return;
  }

  try {
    console.log("[clients] delete before", { id, user_id: DEMO_USER_ID });
    const { error } = await supabase.from("clients").delete().eq("id", id).eq("user_id", DEMO_USER_ID);
    console.log("[clients] delete after", { error });

    if (error) {
      console.error("[clients] delete failed", error);
    }
  } catch (error) {
    console.error("[clients] delete exception", error);
    return;
  }
}
