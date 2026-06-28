import { requireSupabaseClient, resolveProfileClientId, throwSupabaseError } from "@/lib/services/shared";
import type { Activity, ActivityType } from "@/types";
import type { ActivityRow } from "@/types/database";

export interface ActivityInput {
  clientId?: string | null;
  description: string;
  type: ActivityType;
}

const activityTypes = new Set<ActivityType>(["client", "deal", "task", "payment"]);

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
    clientId: row.client_id,
    type,
    title: getTitle(type),
    description: row.description,
    time: formatRelativeTime(row.created_at),
    createdAt: row.created_at
  };
}

export async function getActivities(profileId: string): Promise<Activity[]> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      throwSupabaseError("activities", "select", error);
    }

    return data.map(mapRowToActivity);
  } catch (error) {
    throwSupabaseError("activities", "select", error);
  }
}

export async function getActivitiesByClientId(
  profileId: string,
  clientId: string
): Promise<Activity[]> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", profileId)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      throwSupabaseError("activities", "select by client", error);
    }

    return data.map(mapRowToActivity);
  } catch (error) {
    throwSupabaseError("activities", "select by client", error);
  }
}

export async function createActivity(profileId: string, input: ActivityInput): Promise<Activity> {
  const supabase = requireSupabaseClient();

  try {
    const clientId = await resolveProfileClientId(profileId, input.clientId);
    const payload = {
      user_id: profileId,
      client_id: clientId,
      type: input.type,
      description: input.description
    };

    const { data, error } = await supabase
      .from("activities")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      throwSupabaseError("activities", "insert", error);
    }

    return mapRowToActivity(data);
  } catch (error) {
    throwSupabaseError("activities", "insert", error);
  }
}
