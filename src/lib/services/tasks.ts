import { DEMO_USER_ID } from "@/lib/supabase";
import { nullableUuid, requireSupabaseClient, throwSupabaseError } from "@/lib/services/shared";
import type { Task, TaskPriority, TaskStatus } from "@/types";
import type { TaskRow } from "@/types/database";

export interface TaskUpsertInput {
  clientId: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
}

const taskStatuses = new Set<TaskStatus>(["Today", "Upcoming", "Done", "Overdue"]);
const taskPriorities = new Set<TaskPriority>(["Low", "Medium", "High"]);

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeStatus(value: string | null | undefined): TaskStatus {
  return value && taskStatuses.has(value as TaskStatus) ? (value as TaskStatus) : "Today";
}

function normalizePriority(value: string | null | undefined): TaskPriority {
  return value && taskPriorities.has(value as TaskPriority) ? (value as TaskPriority) : "Medium";
}

function mapRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    clientId: row.client_id ?? "",
    title: row.title,
    description: row.description ?? "",
    dueDate: row.due_date ?? todayIsoDate(),
    status: normalizeStatus(row.status),
    priority: normalizePriority(row.priority),
    createdAt: row.created_at
  };
}

export async function getTasks(): Promise<Task[]> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .order("created_at", { ascending: false });

    if (error || !data) {
      throwSupabaseError("tasks", "select", error);
    }

    return data.map(mapRowToTask);
  } catch (error) {
    throwSupabaseError("tasks", "select", error);
  }
}

export async function createTask(input: TaskUpsertInput): Promise<Task> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: DEMO_USER_ID,
        client_id: nullableUuid(input.clientId),
        title: input.title.trim(),
        description: input.description.trim(),
        due_date: input.dueDate,
        status: input.status,
        priority: input.priority
      })
      .select("*")
      .single();

    if (error || !data) {
      throwSupabaseError("tasks", "insert", error);
    }

    return mapRowToTask(data);
  } catch (error) {
    throwSupabaseError("tasks", "insert", error);
  }
}

export async function updateTask(
  id: string,
  input: TaskUpsertInput
): Promise<Task> {
  const supabase = requireSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        client_id: nullableUuid(input.clientId),
        title: input.title.trim(),
        description: input.description.trim(),
        due_date: input.dueDate,
        status: input.status,
        priority: input.priority
      })
      .eq("id", id)
      .eq("user_id", DEMO_USER_ID)
      .select("*")
      .single();

    if (error || !data) {
      throwSupabaseError("tasks", "update", error);
    }

    return mapRowToTask(data);
  } catch (error) {
    throwSupabaseError("tasks", "update", error);
  }
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = requireSupabaseClient();

  try {
    const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", DEMO_USER_ID);

    if (error) {
      throwSupabaseError("tasks", "delete", error);
    }
  } catch (error) {
    throwSupabaseError("tasks", "delete", error);
  }
}
