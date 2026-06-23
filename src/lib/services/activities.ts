import { activities as mockActivities } from "@/data/mockData";
import { DEMO_USER_ID, getSupabaseClient } from "@/lib/supabase";
import type { Activity, ActivityType } from "@/types";
import type { ActivityRow } from "@/types/database";

export interface ActivityInput {
  clientId?: string | null;
  description: string;
  type: ActivityType;
}

const activityTypes = new Set<ActivityType>(["client", "deal", "task", "payment"]);

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

function formatRelativeTime(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  if (Number.isNaN(diff) || diff < 0) {
    return "Just now";
  }
  if (diff < 60_000) {
    return "Just now";
  }
  if (diff < 3_600_000) {
    return `${Math.max(1, Math.round(diff / 60_000))} min ago`;
  }
  if (diff < 86_400_000) {
    return `${Math.max(1, Math.round(diff / 3_600_000))}h ago`;
  }
  return new Date(isoString).toISOString().slice(0, 10);
}

function getTitle(type: ActivityType) {
  return {
    client: "Client update",
    deal: "Deal update",
    task: "Task update",
    payment: "Payment update"
  }[type];
}

function normalizeType(value: string | null | undefined): ActivityType {
  return value && activityTypes.has(value as ActivityType) ? (value as ActivityType) : "client";
}

function mapRowToActivity(row: ActivityRow): Activity {
  const type = normalizeType(row.type);
  return {
    id: row.id,
    type,
    title: getTitle(type),
    description: row.description,
    time: formatRelativeTime(row.created_at)
  };
}

export async function getActivities(): Promise<Activity[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return mockActivities.map((activity) => ({ ...activity }));
  }

  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return mockActivities.map((activity) => ({ ...activity }));
    }

    return data.map(mapRowToActivity);
  } catch {
    return mockActivities.map((activity) => ({ ...activity }));
  }
}

export async function createActivity(input: ActivityInput): Promise<Activity> {
  const fallbackActivity: Activity = {
    id: createId("activity"),
    type: input.type,
    title: getTitle(input.type),
    description: input.description,
    time: "Just now"
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    return fallbackActivity;
  }

  try {
    const payload = {
      user_id: DEMO_USER_ID,
      client_id: input.clientId ?? null,
      type: input.type,
      description: input.description
    };

    const { data, error } = await supabase
      .from("activities")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      return fallbackActivity;
    }

    return mapRowToActivity(data);
  } catch {
    return fallbackActivity;
  }
}
