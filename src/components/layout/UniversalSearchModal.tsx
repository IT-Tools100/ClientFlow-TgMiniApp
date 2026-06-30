"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Activity, Client, Deal, NavTab, Task } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  formatActivityType,
  formatClientStatus,
  formatDealStatus,
  formatTaskCompletion,
  formatTaskDue,
  labels
} from "@/lib/labels";

interface UniversalSearchModalProps {
  activities: Activity[];
  clients: Client[];
  deals: Deal[];
  isOpen: boolean;
  onClose: () => void;
  onOpenClient: (clientId: string) => void;
  onOpenTab: (tab: NavTab) => void;
  tasks: Task[];
}

type TaskDueState = "Overdue" | "Today" | "Upcoming";
type TaskCompletionState = "Active" | "Done";

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-accent-cyan/60 focus:ring-2 focus:ring-accent-cyan/15";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "USD"
});

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

function getTaskCompletionState(task: Task): TaskCompletionState {
  return task.status === "Done" ? "Done" : "Active";
}

function getTaskDueState(task: Task): TaskDueState {
  const dueDateKey = normalizeDateKey(task.dueDate);
  const todayKey = getLocalTodayKey();

  if (!dueDateKey) {
    return "Upcoming";
  }

  if (dueDateKey < todayKey) {
    return "Overdue";
  }

  return dueDateKey === todayKey ? "Today" : "Upcoming";
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function includesQuery(query: string, values: Array<string | number | null | undefined>) {
  return values
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function UniversalSearchModal({
  activities,
  clients,
  deals,
  isOpen,
  onClose,
  onOpenClient,
  onOpenTab,
  tasks
}: UniversalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );
  const hasCrmData =
    clients.length > 0 || tasks.length > 0 || deals.length > 0 || activities.length > 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);

    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    const debounceTimer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => window.clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  const results = useMemo(() => {
    const normalizedQuery = normalizeSearch(debouncedQuery);

    if (!normalizedQuery) {
      return {
        activities: [],
        clients: [],
        deals: [],
        tasks: []
      };
    }

    const clientResults = clients.filter((client) =>
      includesQuery(normalizedQuery, [
        client.name,
        client.contact,
        client.source,
        client.notes,
        client.status,
        client.value
      ])
    );
    const taskResults = tasks.filter((task) => {
      const clientName = clientNameById.get(task.clientId) ?? labels.common.unknownClient;
      const completion = getTaskCompletionState(task);
      const dueState = getTaskDueState(task);

      return includesQuery(normalizedQuery, [
        task.title,
        task.description,
        clientName,
        completion,
        dueState,
        task.priority,
        task.dueDate
      ]);
    });
    const dealResults = deals.filter((deal) => {
      const clientName = clientNameById.get(deal.clientId) ?? labels.common.unknownClient;

      return includesQuery(normalizedQuery, [
        deal.title,
        clientName,
        deal.status,
        deal.amount,
        moneyFormatter.format(deal.amount),
        deal.probability
      ]);
    });
    const activityResults = activities.filter((activity) => {
      const clientName = activity.clientId
        ? clientNameById.get(activity.clientId) ?? labels.common.unknownClient
        : "";

      return includesQuery(normalizedQuery, [
        activity.title,
        activity.description,
        activity.type,
        activity.time,
        activity.createdAt,
        clientName
      ]);
    });

    return {
      activities: activityResults.slice(0, 8),
      clients: clientResults.slice(0, 8),
      deals: dealResults.slice(0, 8),
      tasks: taskResults.slice(0, 8)
    };
  }, [activities, clientNameById, clients, deals, debouncedQuery, tasks]);

  const hasQuery = normalizeSearch(debouncedQuery).length > 0;
  const hasResults =
    results.clients.length > 0 ||
    results.tasks.length > 0 ||
    results.deals.length > 0 ||
    results.activities.length > 0;

  function openTab(tab: NavTab) {
    onClose();
    onOpenTab(tab);
  }

  function openClient(clientId: string) {
    onClose();
    onOpenClient(clientId);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fade-enter fixed inset-0 z-[70] flex items-end bg-black/60 px-4 pb-24 backdrop-blur-sm">
      <GlassCard className="modal-enter mx-auto max-h-[86vh] w-full max-w-md overflow-y-auto p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan/80">
              Единый поиск
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">Поиск по CRM</h2>
          </div>
          <button
            aria-label="Закрыть поиск"
            className="tap-highlight rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white"
            onClick={onClose}
            type="button"
          >
            {labels.common.close}
          </button>
        </div>

        <input
          className={inputClass}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Клиенты, задачи, сделки, действия"
          ref={inputRef}
          value={query}
        />

        <div className="mt-5 space-y-5">
          {!hasCrmData ? (
            <EmptyState
              description="Создайте клиентов, задачи, сделки или действия, чтобы пользоваться единым поиском."
              title="В CRM пока нет данных"
            />
          ) : !hasQuery ? (
            <GlassCard className="p-4">
              <p className="text-sm font-medium text-white">Введите запрос</p>
              <p className="mt-1 text-sm leading-6 text-app-muted">
                Поиск работает локально по уже загруженным данным CRM.
              </p>
            </GlassCard>
          ) : hasResults ? (
            <>
              {results.clients.length > 0 ? (
                <ResultGroup title="Клиенты">
                  {results.clients.map((client) => (
                    <button
                      className="tap-highlight w-full rounded-2xl bg-white/[0.06] px-3 py-3 text-left transition hover:bg-white/[0.1]"
                      key={client.id}
                      onClick={() => openClient(client.id)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {client.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-app-muted">
                            {client.contact || client.source || "Контакт не указан"}
                          </p>
                        </div>
                        <Badge tone={getStatusTone(client.status)}>
                          {formatClientStatus(client.status)}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </ResultGroup>
              ) : null}

              {results.tasks.length > 0 ? (
                <ResultGroup title="Задачи">
                  {results.tasks.map((task) => {
                    const completion = getTaskCompletionState(task);
                    const dueState = getTaskDueState(task);

                    return (
                      <button
                        className="tap-highlight w-full rounded-2xl bg-white/[0.06] px-3 py-3 text-left transition hover:bg-white/[0.1]"
                        key={task.id}
                        onClick={() => openTab("tasks")}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {task.title}
                            </p>
                            <p className="mt-1 truncate text-xs text-app-muted">
                              {clientNameById.get(task.clientId) ?? labels.common.unknownClient}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <Badge tone={getStatusTone(completion === "Done" ? "Done" : "Upcoming")}>
                              {formatTaskCompletion(completion)}
                            </Badge>
                            <Badge tone={getStatusTone(dueState)}>{formatTaskDue(dueState)}</Badge>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </ResultGroup>
              ) : null}

              {results.deals.length > 0 ? (
                <ResultGroup title="Сделки">
                  {results.deals.map((deal) => (
                    <button
                      className="tap-highlight w-full rounded-2xl bg-white/[0.06] px-3 py-3 text-left transition hover:bg-white/[0.1]"
                      key={deal.id}
                      onClick={() => openTab("deals")}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{deal.title}</p>
                          <p className="mt-1 truncate text-xs text-app-muted">
                            {clientNameById.get(deal.clientId) ?? labels.common.unknownClient}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge tone={getStatusTone(deal.status)}>
                            {formatDealStatus(deal.status)}
                          </Badge>
                          <p className="mt-2 text-xs font-semibold text-white">
                            {moneyFormatter.format(deal.amount)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </ResultGroup>
              ) : null}

              {results.activities.length > 0 ? (
                <ResultGroup title="Действия">
                  {results.activities.map((activity) => (
                    <button
                      className="tap-highlight w-full rounded-2xl bg-white/[0.06] px-3 py-3 text-left transition hover:bg-white/[0.1]"
                      key={activity.id}
                      onClick={() => openTab("dashboard")}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold capitalize text-white">
                            {formatActivityType(activity.type)}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-app-muted">
                            {activity.description}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">{activity.time}</span>
                      </div>
                    </button>
                  ))}
                </ResultGroup>
              ) : null}
            </>
          ) : (
            <EmptyState
              description="По этому запросу не найдены клиенты, задачи, сделки или действия."
              title="Ничего не найдено"
            />
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function ResultGroup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-app-muted">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
