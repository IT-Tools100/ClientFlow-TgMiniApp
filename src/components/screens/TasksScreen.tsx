"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Client, Task, TaskPriority, TaskStatus } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { TaskUpsertInput } from "@/lib/services/tasks";

const TASK_STATUSES: TaskStatus[] = ["Today", "Upcoming", "Done", "Overdue"];
const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];

type TaskViewFilter = "All" | "Active" | "Completed" | "Due Today" | "Overdue";
type PriorityFilter = "All" | TaskPriority;
type ClientFilter = "All" | string;

interface TaskFormState {
  clientId: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
}

interface TasksScreenProps {
  clients: Client[];
  tasks: Task[];
  onCreateTask: (input: TaskUpsertInput) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateTask: (id: string, input: TaskUpsertInput) => Promise<void>;
}

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-accent-cyan/60 focus:ring-2 focus:ring-accent-cyan/15";

function getLocalTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDateKey(value: string | null | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return "";
  }

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);

  return match?.[1] ?? "";
}

function isTaskCompleted(task: Task) {
  return task.status === "Done";
}

function isTaskDueToday(task: Task) {
  const dueDateKey = normalizeDateKey(task.dueDate);

  return !isTaskCompleted(task) && dueDateKey !== "" && dueDateKey === getLocalTodayKey();
}

function isTaskOverdue(task: Task) {
  const dueDateKey = normalizeDateKey(task.dueDate);

  return !isTaskCompleted(task) && dueDateKey !== "" && dueDateKey < getLocalTodayKey();
}

function getTaskComputedState(task: Task): "Completed" | "Due Today" | "Overdue" | "Active" {
  if (isTaskCompleted(task)) {
    return "Completed";
  }

  if (isTaskOverdue(task)) {
    return "Overdue";
  }

  if (isTaskDueToday(task)) {
    return "Due Today";
  }

  return "Active";
}

function getTaskBadge(task: Task, computedState: ReturnType<typeof getTaskComputedState>) {
  if (computedState === "Completed") {
    return {
      label: "Done",
      tone: getStatusTone("Done")
    };
  }

  if (computedState === "Overdue") {
    return {
      label: "Overdue",
      tone: getStatusTone("Overdue")
    };
  }

  if (computedState === "Due Today") {
    return {
      label: "Today",
      tone: getStatusTone("Today")
    };
  }

  return {
    label: task.status === "Upcoming" ? "Upcoming" : "Active",
    tone: task.status === "Upcoming" ? getStatusTone("Upcoming") : getStatusTone("Today")
  };
}

function getActiveStatusForDueDate(dueDate: string): TaskStatus {
  const dueDateKey = normalizeDateKey(dueDate);
  const todayKey = getLocalTodayKey();

  if (!dueDateKey) {
    return "Upcoming";
  }

  if (dueDateKey < todayKey) {
    return "Overdue";
  }

  return dueDateKey === todayKey ? "Today" : "Upcoming";
}

function createEmptyForm(clientId: string): TaskFormState {
  return {
    clientId,
    title: "",
    description: "",
    dueDate: getLocalTodayKey(),
    status: "Today",
    priority: "Medium"
  };
}

function taskToForm(task: Task): TaskFormState {
  return {
    clientId: task.clientId,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    priority: task.priority
  };
}

export function TasksScreen({
  clients,
  tasks,
  onCreateTask,
  onDeleteTask,
  onUpdateTask
}: TasksScreenProps) {
  const defaultClientId = clients[0]?.id ?? "";
  const [taskViewFilter, setTaskViewFilter] = useState<TaskViewFilter>("All");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All");
  const [clientFilter, setClientFilter] = useState<ClientFilter>("All");
  const [query, setQuery] = useState("");
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(() => createEmptyForm(defaultClientId));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );

  const filteredTasks = useMemo(
    () => {
      const normalizedQuery = query.trim().toLowerCase();

      return tasks.filter((task) => {
        const clientName = clientNameById.get(task.clientId) ?? "Unknown client";
        const searchable = [
          task.title,
          task.description,
          clientName,
          task.status,
          task.priority
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
        const computedState = getTaskComputedState(task);
        const matchesTaskView =
          taskViewFilter === "All" ||
          (taskViewFilter === "Active" && computedState !== "Completed") ||
          (taskViewFilter === "Completed" && computedState === "Completed") ||
          (taskViewFilter === "Due Today" && computedState === "Due Today") ||
          (taskViewFilter === "Overdue" && computedState === "Overdue");
        const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
        const matchesClient = clientFilter === "All" || task.clientId === clientFilter;

        return matchesQuery && matchesTaskView && matchesPriority && matchesClient;
      });
    },
    [clientFilter, clientNameById, priorityFilter, query, taskViewFilter, tasks]
  );

  const summary = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((task) => getTaskComputedState(task) !== "Completed").length,
      completed: tasks.filter((task) => getTaskComputedState(task) === "Completed").length,
      dueToday: tasks.filter((task) => getTaskComputedState(task) === "Due Today").length,
      overdue: tasks.filter((task) => getTaskComputedState(task) === "Overdue").length
    }),
    [tasks]
  );

  function openAddForm() {
    setForm(createEmptyForm(defaultClientId));
    setEditingTaskId(null);
    setFormMode("add");
  }

  function openEditForm(task: Task) {
    setForm(taskToForm(task));
    setEditingTaskId(task.id);
    setFormMode("edit");
  }

  function closeForm() {
    setFormMode(null);
    setEditingTaskId(null);
    setForm(createEmptyForm(defaultClientId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      if (formMode === "edit" && editingTaskId) {
        await onUpdateTask(editingTaskId, form);
      } else {
        await onCreateTask(form);
      }
      closeForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDeleteTask(taskId: string) {
    setIsSubmitting(true);

    try {
      await onDeleteTask(taskId);
      if (editingTaskId === taskId) {
        closeForm();
      }
      setTaskToDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function toggleComplete(task: Task) {
    setIsSubmitting(true);

    try {
      const isCompleted = isTaskCompleted(task);

      await onUpdateTask(task.id, {
        clientId: task.clientId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: isCompleted ? getActiveStatusForDueDate(task.dueDate) : "Done",
        priority: task.priority
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-purple/20 blur-2xl" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-app-muted">Task control</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">{summary.dueToday}</p>
            <p className="mt-1 text-sm text-slate-300">
              Due today · {summary.overdue} overdue
            </p>
          </div>
          <Button onClick={openAddForm}>Add Task</Button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <TaskMetric label="Total tasks" value={summary.total} />
        <TaskMetric label="Active tasks" value={summary.active} />
        <TaskMetric label="Completed" value={summary.completed} />
        <TaskMetric label="Due today" value={summary.dueToday} tone="cyan" />
        <TaskMetric className="col-span-2" label="Overdue" value={summary.overdue} tone="red" />
      </div>

      <GlassCard className="p-4">
        <div className="space-y-3">
          <input
            className={inputClass}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, client, status, priority"
            type="search"
            value={query}
          />
          <FilterRow
            activeValue={taskViewFilter}
            items={["All", "Active", "Completed", "Due Today", "Overdue"]}
            onChange={(value) => setTaskViewFilter(value as TaskViewFilter)}
          />
          <select
            className={inputClass}
            onChange={(event) => setClientFilter(event.target.value)}
            value={clientFilter}
          >
            <option value="All">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <FilterRow
            activeValue={priorityFilter}
            items={["All", ...TASK_PRIORITIES]}
            onChange={(value) => setPriorityFilter(value as PriorityFilter)}
          />
        </div>
      </GlassCard>

      <section>
        <SectionHeader action={`${filteredTasks.length} shown`} eyebrow="Tasks" title="Task list" />
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const computedState = getTaskComputedState(task);
              const isCompleted = computedState === "Completed";
              const isOverdue = computedState === "Overdue";
              const taskBadge = getTaskBadge(task, computedState);
              const clientName = clientNameById.get(task.clientId) ?? "Unknown client";

              return (
              <GlassCard
                className={`p-4 ${isOverdue ? "border-accent-red/40 bg-accent-red/[0.10]" : ""} ${
                  isCompleted ? "opacity-75" : ""
                }`}
                data-testid="task-card"
                data-title={task.title}
                key={task.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      className={`truncate font-semibold text-white ${
                        isCompleted ? "line-through decoration-white/50" : ""
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className="mt-1 text-sm text-app-muted">
                      {clientName}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{task.description}</p>
                  </div>
                  <Badge tone={taskBadge.tone}>{taskBadge.label}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <InfoPill label="Due" value={task.dueDate} />
                  <InfoPill label="Priority" value={task.priority} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button
                    disabled={isSubmitting}
                    onClick={() => void toggleComplete(task)}
                    variant="secondary"
                  >
                    {isCompleted ? "Reopen" : "Complete"}
                  </Button>
                  <Button onClick={() => openEditForm(task)} variant="ghost">
                    Edit
                  </Button>
                  <Button
                    className="border border-accent-red/30 bg-accent-red/[0.12] text-rose-100 hover:bg-accent-red/[0.18]"
                    onClick={() => setTaskToDelete(task)}
                    variant="ghost"
                  >
                    Delete
                  </Button>
                </div>
              </GlassCard>
              );
            })
          ) : (
            <EmptyState
              actionLabel="Add Task"
              description={getEmptyStateDescription(tasks.length, taskViewFilter)}
              onAction={openAddForm}
              title={getEmptyStateTitle(tasks.length, taskViewFilter)}
            />
          )}
        </div>
      </section>

      {formMode ? (
        <div className="fade-enter fixed inset-0 z-50 flex items-end bg-black/55 px-4 pb-24 backdrop-blur-sm">
          <GlassCard className="modal-enter mx-auto max-h-[82vh] w-full max-w-md overflow-y-auto p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan/80">
                  {formMode === "add" ? "New task" : "Edit task"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {formMode === "add" ? "Add Task" : "Update Task"}
                </h2>
              </div>
              <button
                aria-label="Close task form"
                className="tap-highlight rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white"
                onClick={closeForm}
                type="button"
              >
                Close
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Client">
                <select
                  className={inputClass}
                  onChange={(event) => setForm({ ...form, clientId: event.target.value })}
                  required
                  value={form.clientId}
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Title">
                <input
                  className={inputClass}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Follow up with client"
                  required
                  value={form.title}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className={`${inputClass} min-h-24 resize-none py-3`}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="What needs to be done?"
                  value={form.description}
                />
              </Field>
              <Field label="Due date">
                <input
                  className={inputClass}
                  onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                  required
                  type="date"
                  value={form.dueDate}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select
                    className={inputClass}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value as TaskStatus })
                    }
                    value={form.status}
                  >
                    {TASK_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    className={inputClass}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value as TaskPriority })
                    }
                    value={form.priority}
                  >
                    {TASK_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button disabled={isSubmitting} onClick={closeForm} variant="ghost">
                  Cancel
                </Button>
                <Button disabled={!form.clientId || isSubmitting} type="submit">
                  {isSubmitting ? "Saving..." : formMode === "add" ? "Create" : "Save"}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      ) : null}

      {taskToDelete ? (
        <ConfirmDialog
          body={`Delete "${taskToDelete.title}"? This removes it from Supabase.`}
          onCancel={() => setTaskToDelete(null)}
          onConfirm={() => void confirmDeleteTask(taskToDelete.id)}
          title="Delete task"
        />
      ) : null}
    </section>
  );
}

function FilterRow({
  activeValue,
  items,
  onChange
}: {
  activeValue: string;
  items: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = activeValue === item;

        return (
          <button
            className={`tap-highlight shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
              isActive
                ? "border-white/40 bg-white text-slate-950"
                : "border-white/10 bg-white/[0.07] text-app-muted"
            }`}
            key={item}
            onClick={() => onChange(item)}
            type="button"
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-app-muted">{label}</span>
      {children}
    </label>
  );
}

function TaskMetric({
  className = "",
  label,
  tone = "slate",
  value
}: {
  className?: string;
  label: string;
  tone?: "cyan" | "red" | "slate";
  value: number;
}) {
  const toneClass = {
    cyan: "border-accent-cyan/30 bg-accent-cyan/[0.12]",
    red: "border-accent-red/30 bg-accent-red/[0.12]",
    slate: "border-white/10 bg-white/[0.08]"
  }[tone];

  return (
    <GlassCard className={`p-4 ${toneClass} ${className}`}>
      <p className="text-xs text-app-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </GlassCard>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] px-3 py-2">
      <p className="text-[11px] text-app-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function getEmptyStateTitle(totalTasks: number, filter: TaskViewFilter) {
  if (totalTasks === 0) {
    return "No tasks yet";
  }

  if (filter === "Overdue") {
    return "No overdue tasks";
  }

  if (filter === "Due Today") {
    return "No tasks due today";
  }

  return "No task results";
}

function getEmptyStateDescription(totalTasks: number, filter: TaskViewFilter) {
  if (totalTasks === 0) {
    return "Create the first follow-up, deadline, or delivery task for a client.";
  }

  if (filter === "Overdue") {
    return "Nothing is past due under the current filters.";
  }

  if (filter === "Due Today") {
    return "There are no active tasks due today under the current filters.";
  }

  return "No tasks match the current search, client, priority, or task filter.";
}
