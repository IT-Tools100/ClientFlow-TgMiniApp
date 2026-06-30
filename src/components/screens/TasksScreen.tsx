"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Client, Task, TaskPriority, TaskStatus } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fieldClass, modalBackdropClass, modalCardClass } from "@/components/ui/styles";
import { formatPriority, formatTaskCompletion, formatTaskDue, labels } from "@/lib/labels";
import type { TaskUpsertInput } from "@/lib/services/tasks";

const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];
const COMPLETION_STATES: TaskCompletionState[] = ["Active", "Done"];
const DUE_STATES: TaskDueState[] = ["Overdue", "Today", "Upcoming"];

type TaskCompletionState = "Active" | "Done";
type TaskDueState = "Overdue" | "Today" | "Upcoming";
type CompletionFilter = "All" | TaskCompletionState;
type DueFilter = "All due" | TaskDueState;
type PriorityFilter = "All" | TaskPriority;
type ClientFilter = "All" | string;

interface TaskFormState {
  clientId: string;
  title: string;
  description: string;
  dueDate: string;
  completion: TaskCompletionState;
  priority: TaskPriority;
}

interface TasksScreenProps {
  clients: Client[];
  tasks: Task[];
  onCreateTask: (input: TaskUpsertInput) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpdateTask: (id: string, input: TaskUpsertInput) => Promise<void>;
}

const inputClass = fieldClass;

function localDateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalTodayKey() {
  return localDateKeyFromDate(new Date());
}

function normalizeDateKey(value: string | null | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    return "";
  }

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);

  return match?.[1] ?? "";
}

function getDueStateFromDateKey(dueDate: string): TaskDueState {
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

function getTaskCompletionState(task: Task): TaskCompletionState {
  return task.status === "Done" ? "Done" : "Active";
}

function getTaskDueState(task: Task): TaskDueState {
  return getDueStateFromDateKey(task.dueDate);
}

function isTaskDone(task: Task) {
  return getTaskCompletionState(task) === "Done";
}

function isTaskActive(task: Task) {
  return getTaskCompletionState(task) === "Active";
}

function isTaskOverdue(task: Task) {
  return getTaskDueState(task) === "Overdue";
}

function isTaskToday(task: Task) {
  return getTaskDueState(task) === "Today";
}

function isTaskUpcoming(task: Task) {
  return getTaskDueState(task) === "Upcoming";
}

function getStatusFromCompletionAndDueState(
  completion: TaskCompletionState,
  dueState: TaskDueState
): TaskStatus {
  if (completion === "Done") {
    return "Done";
  }

  return dueState;
}

function getTaskCompletionBadge(completion: TaskCompletionState) {
  if (completion === "Done") {
    return {
      label: formatTaskCompletion("Done"),
      tone: getStatusTone("Done")
    };
  }

  return {
    label: formatTaskCompletion("Active"),
    tone: getStatusTone("Today")
  };
}

function getTaskDueBadge(dueState: TaskDueState) {
  if (dueState === "Overdue") {
    return {
      label: formatTaskDue("Overdue"),
      tone: getStatusTone("Overdue")
    };
  }

  if (dueState === "Today") {
    return {
      label: formatTaskDue("Today"),
      tone: getStatusTone("Today")
    };
  }

  return {
    label: formatTaskDue("Upcoming"),
    tone: getStatusTone("Upcoming")
  };
}

function createEmptyForm(clientId: string): TaskFormState {
  return {
    clientId,
    title: "",
    description: "",
    dueDate: getLocalTodayKey(),
    completion: "Active",
    priority: "Medium"
  };
}

function taskToForm(task: Task): TaskFormState {
  return {
    clientId: task.clientId,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    completion: getTaskCompletionState(task),
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
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("All");
  const [dueFilter, setDueFilter] = useState<DueFilter>("All due");
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
          getTaskCompletionState(task),
          getTaskDueState(task),
          task.priority
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
        const completionState = getTaskCompletionState(task);
        const dueState = getTaskDueState(task);
        const matchesCompletion =
          completionFilter === "All" || completionState === completionFilter;
        const matchesDue =
          dueFilter === "All due" || (completionState === "Active" && dueState === dueFilter);
        const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
        const matchesClient = clientFilter === "All" || task.clientId === clientFilter;

        return matchesQuery && matchesCompletion && matchesDue && matchesPriority && matchesClient;
      });
    },
    [clientFilter, clientNameById, completionFilter, dueFilter, priorityFilter, query, tasks]
  );

  const summary = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter(isTaskActive).length,
      done: tasks.filter(isTaskDone).length,
      overdue: tasks.filter((task) => isTaskActive(task) && isTaskOverdue(task)).length,
      today: tasks.filter((task) => isTaskActive(task) && isTaskToday(task)).length,
      upcoming: tasks.filter((task) => isTaskActive(task) && isTaskUpcoming(task)).length
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

  function updateFormDueDate(dueDate: string) {
    const normalizedDueDate = normalizeDateKey(dueDate);

    setForm({
      ...form,
      dueDate: normalizedDueDate
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const input = formToTaskInput(form);

      if (formMode === "edit" && editingTaskId) {
        await onUpdateTask(editingTaskId, input);
      } else {
        await onCreateTask(input);
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
      const completion = isTaskDone(task) ? "Active" : "Done";
      const dueState = getTaskDueState(task);

      await onUpdateTask(task.id, {
        clientId: task.clientId,
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        status: getStatusFromCompletionAndDueState(completion, dueState),
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
            <p className="text-sm font-medium text-app-muted">Контроль задач</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">{summary.today}</p>
            <p className="mt-1 text-sm text-slate-300">
              Сегодня · {summary.overdue} просрочено
            </p>
          </div>
          <Button onClick={openAddForm}>Добавить задачу</Button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <TaskMetric label="Всего задач" value={summary.total} />
        <TaskMetric label="Активные" value={summary.active} />
        <TaskMetric label="Выполнены" value={summary.done} />
        <TaskMetric label="Просрочены" value={summary.overdue} tone="red" />
        <TaskMetric label="Сегодня" value={summary.today} tone="cyan" />
        <TaskMetric className="col-span-2" label="Предстоящие" value={summary.upcoming} />
      </div>

      <GlassCard className="p-4">
        <div className="space-y-3">
          <input
            className={inputClass}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию, клиенту, статусу, приоритету"
            type="search"
            value={query}
          />
          <FilterRow
            activeValue={completionFilter}
            items={["All", ...COMPLETION_STATES]}
            onChange={(value) => setCompletionFilter(value as CompletionFilter)}
          />
          <FilterRow
            activeValue={dueFilter}
            items={["All due", ...DUE_STATES]}
            onChange={(value) => setDueFilter(value as DueFilter)}
          />
          <select
            className={inputClass}
            onChange={(event) => setClientFilter(event.target.value)}
            value={clientFilter}
          >
            <option value="All">Все клиенты</option>
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
        <SectionHeader action={`${filteredTasks.length} показано`} eyebrow="Задачи" title="Список задач" />
        <div className="space-y-3">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const completionState = getTaskCompletionState(task);
              const dueState = getTaskDueState(task);
              const isCompleted = completionState === "Done";
              const isOverdue = completionState === "Active" && dueState === "Overdue";
              const completionBadge = getTaskCompletionBadge(completionState);
              const dueBadge = getTaskDueBadge(dueState);
              const clientName = clientNameById.get(task.clientId) ?? labels.common.unknownClient;

              return (
                <GlassCard
                  className={`p-4 ${
                    isOverdue ? "border-accent-red/40 bg-accent-red/[0.10]" : ""
                  } ${isCompleted ? "opacity-75" : ""}`}
                  data-testid="task-card"
                  data-title={task.title}
                  interactive
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
                      <p className="mt-1 text-sm text-app-muted">{clientName}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-400">{task.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge tone={completionBadge.tone}>{completionBadge.label}</Badge>
                      <Badge tone={dueBadge.tone}>{dueBadge.label}</Badge>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <InfoPill label="Срок" value={task.dueDate || "Без даты"} />
                    <InfoPill label="Приоритет" value={formatPriority(task.priority)} />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Button
                      disabled={isSubmitting}
                      onClick={() => void toggleComplete(task)}
                      variant="secondary"
                    >
                      {isCompleted ? "Вернуть" : "Завершить"}
                    </Button>
                    <Button onClick={() => openEditForm(task)} variant="ghost">
                      Изменить
                    </Button>
                    <Button onClick={() => setTaskToDelete(task)} variant="danger">
                      Удалить
                    </Button>
                  </div>
                </GlassCard>
              );
            })
          ) : (
            <EmptyState
              actionLabel="Добавить задачу"
              description={getEmptyStateDescription(tasks.length, completionFilter, dueFilter)}
              onAction={openAddForm}
              title={getEmptyStateTitle(tasks.length, completionFilter, dueFilter)}
            />
          )}
        </div>
      </section>

      {formMode ? (
        <div className={modalBackdropClass}>
          <GlassCard className={modalCardClass}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan/80">
                  {formMode === "add" ? "Новая задача" : "Редактирование задачи"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {formMode === "add" ? "Добавить задачу" : "Обновить задачу"}
                </h2>
              </div>
              <button
                aria-label="Закрыть форму задачи"
                className="tap-highlight rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white"
                onClick={closeForm}
                type="button"
              >
                Закрыть
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Клиент">
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
              <Field label="Название">
                <input
                  className={inputClass}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Связаться с клиентом"
                  required
                  value={form.title}
                />
              </Field>
              <Field label="Описание">
                <textarea
                  className={`${inputClass} min-h-24 resize-none py-3`}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Что нужно сделать?"
                  value={form.description}
                />
              </Field>
              <Field label="Срок">
                <input
                  className={inputClass}
                  onChange={(event) => updateFormDueDate(event.target.value)}
                  required
                  type="date"
                  value={form.dueDate}
                />
              </Field>
              <DueStatusPreview dueDate={form.dueDate} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Выполнение">
                  <select
                    className={inputClass}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        completion: event.target.value as TaskCompletionState
                      })
                    }
                    value={form.completion}
                  >
                    {COMPLETION_STATES.map((completion) => (
                      <option key={completion} value={completion}>
                        {formatTaskCompletion(completion)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Приоритет">
                  <select
                    className={inputClass}
                    onChange={(event) =>
                      setForm({ ...form, priority: event.target.value as TaskPriority })
                    }
                    value={form.priority}
                  >
                    {TASK_PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {formatPriority(priority)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button disabled={isSubmitting} onClick={closeForm} variant="ghost">
                  Отмена
                </Button>
                <Button disabled={!form.clientId || isSubmitting} type="submit">
                  {isSubmitting ? "Сохранение..." : formMode === "add" ? "Создать" : "Сохранить"}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      ) : null}

      {taskToDelete ? (
        <ConfirmDialog
          body={`Удалить "${taskToDelete.title}"? Запись будет удалена из Supabase.`}
          onCancel={() => setTaskToDelete(null)}
          onConfirm={() => void confirmDeleteTask(taskToDelete.id)}
          title="Удалить задачу"
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
            {formatTaskFilterLabel(item)}
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

function DueStatusPreview({ dueDate }: { dueDate: string }) {
  const badge = getTaskDueBadge(getDueStateFromDateKey(dueDate));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3">
      <p className="mb-2 text-xs font-semibold text-app-muted">Статус срока</p>
      <Badge tone={badge.tone}>{badge.label}</Badge>
      <p className="mt-2 text-xs text-app-muted">Рассчитывается по сроку</p>
    </div>
  );
}

function formatTaskFilterLabel(value: string) {
  if (value === "All") {
    return "Все";
  }

  if (value === "All due") {
    return "Все сроки";
  }

  if (value === "Active" || value === "Done") {
    return formatTaskCompletion(value);
  }

  if (value === "Overdue" || value === "Today" || value === "Upcoming") {
    return formatTaskDue(value);
  }

  if (value === "Low" || value === "Medium" || value === "High") {
    return formatPriority(value);
  }

  return value;
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

function formToTaskInput(form: TaskFormState): TaskUpsertInput {
  return {
    clientId: form.clientId,
    title: form.title,
    description: form.description,
    dueDate: normalizeDateKey(form.dueDate),
    status: getStatusFromCompletionAndDueState(
      form.completion,
      getDueStateFromDateKey(form.dueDate)
    ),
    priority: form.priority
  };
}

function getEmptyStateTitle(
  totalTasks: number,
  completionFilter: CompletionFilter,
  dueFilter: DueFilter
) {
  if (totalTasks === 0) {
    return "Задач пока нет";
  }

  if (completionFilter === "Active" && dueFilter === "All due") {
    return "Активных задач нет";
  }

  if (completionFilter === "Done") {
    return "Выполненных задач нет";
  }

  if (dueFilter === "Overdue") {
    return "Просроченных задач нет";
  }

  if (dueFilter === "Today") {
    return "Задач на сегодня нет";
  }

  if (dueFilter === "Upcoming") {
    return "Предстоящих задач нет";
  }

  return "Задачи не найдены";
}

function getEmptyStateDescription(
  totalTasks: number,
  completionFilter: CompletionFilter,
  dueFilter: DueFilter
) {
  if (totalTasks === 0) {
    return "Создайте первую задачу для клиента: follow-up, дедлайн или доставку результата.";
  }

  if (completionFilter === "Active" && dueFilter === "All due") {
    return "По текущему поиску, клиенту или приоритету активных задач нет.";
  }

  if (completionFilter === "Done") {
    return "По текущим фильтрам выполненных задач нет.";
  }

  if (dueFilter === "Overdue") {
    return "По текущим фильтрам активных просроченных задач нет.";
  }

  if (dueFilter === "Today") {
    return "По текущим фильтрам задач на сегодня нет.";
  }

  if (dueFilter === "Upcoming") {
    return "По текущим фильтрам предстоящих задач нет.";
  }

  return "Поиск, выполнение, срок, клиент или приоритет не дали результатов.";
}
