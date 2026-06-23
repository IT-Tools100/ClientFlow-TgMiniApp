import { tasks as mockTasks } from "@/data/mockData";
import { DEMO_USER_ID, getSupabaseClient } from "@/lib/supabase";
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

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
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

function mapInputToTask(input: TaskUpsertInput, id = createId("task"), createdAt = todayIsoDate()): Task {
  return {
    id,
    clientId: input.clientId,
    title: input.title.trim(),
    description: input.description.trim(),
    dueDate: input.dueDate,
    status: input.status,
    priority: input.priority,
    createdAt
  };
}

export async function getTasks(): Promise<Task[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return mockTasks.map((task) => ({ ...task }));
  }

  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return mockTasks.map((task) => ({ ...task }));
    }

    return data.map(mapRowToTask);
  } catch {
    return mockTasks.map((task) => ({ ...task }));
  }
}

export async function createTask(input: TaskUpsertInput): Promise<Task> {
  const fallbackTask = mapInputToTask(input);
  const supabase = getSupabaseClient();
  if (!supabase) {
    return fallbackTask;
  }

  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: DEMO_USER_ID,
        client_id: input.clientId,
        title: input.title.trim(),
        description: input.description.trim(),
        due_date: input.dueDate,
        status: input.status,
        priority: input.priority
      })
      .select("*")
      .single();

    if (error || !data) {
      return fallbackTask;
    }

    return mapRowToTask(data);
  } catch {
    return fallbackTask;
  }
}

export async function updateTask(
  id: string,
  input: TaskUpsertInput,
  existingTask?: Task
): Promise<Task> {
  const fallbackTask = mapInputToTask(input, id, existingTask?.createdAt ?? todayIsoDate());
  const supabase = getSupabaseClient();
  if (!supabase) {
    return fallbackTask;
  }

  try {
    const { data, error } = await supabase
      .from("tasks")
      .update({
        client_id: input.clientId,
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
      return fallbackTask;
    }

    return mapRowToTask(data);
  } catch {
    return fallbackTask;
  }
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  try {
    await supabase.from("tasks").delete().eq("id", id).eq("user_id", DEMO_USER_ID);
  } catch {
    return;
  }
}
