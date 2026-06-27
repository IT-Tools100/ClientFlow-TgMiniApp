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

type StatusFilter = "All" | TaskStatus;
type PriorityFilter = "All" | TaskPriority;

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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function createEmptyForm(clientId: string): TaskFormState {
  return {
    clientId,
    title: "",
    description: "",
    dueDate: todayIsoDate(),
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("All");
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
    () =>
      tasks.filter((task) => {
        const matchesStatus = statusFilter === "All" || task.status === statusFilter;
        const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;

        return matchesStatus && matchesPriority;
      }),
    [priorityFilter, statusFilter, tasks]
  );

  const todayCount = tasks.filter((task) => task.status === "Today").length;
  const overdueCount = tasks.filter((task) => task.status === "Overdue").length;

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

  async function markDone(task: Task) {
    setIsSubmitting(true);

    try {
      await onUpdateTask(task.id, {
        clientId: task.clientId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: "Done",
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
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">{todayCount}</p>
            <p className="mt-1 text-sm text-slate-300">
              Today tasks · {overdueCount} overdue
            </p>
          </div>
          <Button onClick={openAddForm}>Add Task</Button>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="space-y-3">
          <FilterRow
            activeValue={statusFilter}
            items={["All", ...TASK_STATUSES]}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
          />
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
            filteredTasks.map((task) => (
              <GlassCard
                className="p-4"
                data-testid="task-card"
                data-title={task.title}
                key={task.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{task.title}</h3>
                    <p className="mt-1 text-sm text-app-muted">
                      {clientNameById.get(task.clientId) ?? "Unknown client"}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{task.description}</p>
                  </div>
                  <Badge tone={getStatusTone(task.status)}>{task.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <InfoPill label="Due" value={task.dueDate} />
                  <InfoPill label="Priority" value={task.priority} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button
                    disabled={task.status === "Done" || isSubmitting}
                    onClick={() => void markDone(task)}
                    variant="secondary"
                  >
                    Done
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
            ))
          ) : (
            <EmptyState
              actionLabel="Add Task"
              description={
                tasks.length === 0
                  ? "Create the first follow-up, deadline, or delivery task for a client."
                  : "No tasks match these status and priority filters. Adjust filters to see more."
              }
              onAction={openAddForm}
              title={tasks.length === 0 ? "No tasks yet" : "No task results"}
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

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] px-3 py-2">
      <p className="text-[11px] text-app-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
