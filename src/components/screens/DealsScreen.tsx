"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Client, Deal, DealStatus } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { fieldClass, modalBackdropClass, modalCardClass } from "@/components/ui/styles";
import { formatDealStatus, labels } from "@/lib/labels";
import type { DealUpsertInput } from "@/lib/services/deals";

const DEAL_STATUSES: DealStatus[] = ["New", "Negotiation", "Waiting Payment", "Paid", "Lost"];
const ACTIVE_DEAL_STATUSES = new Set<DealStatus>(["New", "Negotiation", "Waiting Payment"]);
const MOVE_SEQUENCE: DealStatus[] = ["New", "Negotiation", "Waiting Payment", "Paid"];

type StatusFilter = "All" | DealStatus;

interface DealFormState {
  clientId: string;
  title: string;
  amount: string;
  status: DealStatus;
  probability: string;
}

interface DealsScreenProps {
  clients: Client[];
  deals: Deal[];
  onCreateDeal: (input: DealUpsertInput) => Promise<void>;
  onDeleteDeal: (id: string) => Promise<void>;
  onUpdateDeal: (id: string, input: DealUpsertInput) => Promise<void>;
}

const inputClass = fieldClass;

const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "USD"
});

function createEmptyForm(clientId: string): DealFormState {
  return {
    clientId,
    title: "",
    amount: "",
    status: "New",
    probability: "40"
  };
}

function dealToForm(deal: Deal): DealFormState {
  return {
    clientId: deal.clientId,
    title: deal.title,
    amount: String(deal.amount),
    status: deal.status,
    probability: String(deal.probability)
  };
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function getDealInput(deal: Deal, status: DealStatus = deal.status): DealUpsertInput {
  return {
    clientId: deal.clientId,
    title: deal.title,
    amount: deal.amount,
    status,
    probability: deal.probability
  };
}

function getNextStatus(status: DealStatus): DealStatus | null {
  const currentIndex = MOVE_SEQUENCE.indexOf(status);

  if (currentIndex < 0 || currentIndex >= MOVE_SEQUENCE.length - 1) {
    return null;
  }

  return MOVE_SEQUENCE[currentIndex + 1];
}

function getPreviousStatus(status: DealStatus): DealStatus | null {
  const currentIndex = MOVE_SEQUENCE.indexOf(status);

  if (currentIndex <= 0) {
    return null;
  }

  return MOVE_SEQUENCE[currentIndex - 1];
}

export function DealsScreen({
  clients,
  deals,
  onCreateDeal,
  onDeleteDeal,
  onUpdateDeal
}: DealsScreenProps) {
  const defaultClientId = clients[0]?.id ?? "";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [form, setForm] = useState<DealFormState>(() => createEmptyForm(defaultClientId));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );

  const filteredDeals = useMemo(() => {
    const query = normalizeSearch(searchQuery);

    return deals.filter((deal) => {
      const clientName = clientNameById.get(deal.clientId) ?? labels.common.unknownClient;
      const matchesStatus = statusFilter === "All" || deal.status === statusFilter;
      const searchable = [
        deal.title,
        clientName,
        deal.status,
        String(deal.amount),
        moneyFormatter.format(deal.amount)
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [clientNameById, deals, searchQuery, statusFilter]);

  const visibleStages = useMemo(
    () => (statusFilter === "All" ? DEAL_STATUSES : [statusFilter]),
    [statusFilter]
  );

  const dealsByStage = useMemo(() => {
    const grouped = new Map<DealStatus, Deal[]>(DEAL_STATUSES.map((status) => [status, []]));

    for (const deal of filteredDeals) {
      grouped.get(deal.status)?.push(deal);
    }

    return grouped;
  }, [filteredDeals]);

  const totalPipeline = deals.reduce((total, deal) => total + deal.amount, 0);
  const activePipeline = deals
    .filter((deal) => ACTIVE_DEAL_STATUSES.has(deal.status))
    .reduce((total, deal) => total + deal.amount, 0);
  const paidRevenue = deals
    .filter((deal) => deal.status === "Paid")
    .reduce((total, deal) => total + deal.amount, 0);
  const lostAmount = deals
    .filter((deal) => deal.status === "Lost")
    .reduce((total, deal) => total + deal.amount, 0);

  function openAddForm() {
    setForm(createEmptyForm(defaultClientId));
    setEditingDealId(null);
    setFormMode("add");
  }

  function openEditForm(deal: Deal) {
    setForm(dealToForm(deal));
    setEditingDealId(deal.id);
    setFormMode("edit");
  }

  function closeForm() {
    setFormMode(null);
    setEditingDealId(null);
    setForm(createEmptyForm(defaultClientId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const input = {
        clientId: form.clientId,
        title: form.title,
        amount: Number(form.amount) || 0,
        status: form.status,
        probability: Math.min(100, Math.max(0, Number(form.probability) || 0))
      };

      if (formMode === "edit" && editingDealId) {
        await onUpdateDeal(editingDealId, input);
      } else {
        await onCreateDeal(input);
      }
      closeForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDeleteDeal(dealId: string) {
    setIsSubmitting(true);

    try {
      await onDeleteDeal(dealId);
      if (editingDealId === dealId) {
        closeForm();
      }
      setDealToDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function changeDealStatus(deal: Deal, status: DealStatus) {
    if (deal.status === status) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdateDeal(deal.id, getDealInput(deal, status));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-green/20 blur-2xl" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-app-muted">Воронка сделок</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">
              {moneyFormatter.format(totalPipeline)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {deals.length} сделок всего
            </p>
          </div>
          <Button onClick={openAddForm}>Добавить сделку</Button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <SummaryTile label="Активная" value={moneyFormatter.format(activePipeline)} />
          <SummaryTile label="Оплачено" value={moneyFormatter.format(paidRevenue)} />
          <SummaryTile label="Потеряно" value={moneyFormatter.format(lostAmount)} />
          <SummaryTile label="Всего" value={String(deals.length)} />
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-app-muted">Поиск сделок</span>
          <input
            className={inputClass}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Название, клиент, статус, сумма"
            value={searchQuery}
          />
        </label>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {(["All", ...DEAL_STATUSES] as StatusFilter[]).map((status) => {
            const isActive = statusFilter === status;

            return (
              <button
                className={`tap-highlight shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "border-white/40 bg-white text-slate-950"
                    : "border-white/10 bg-white/[0.07] text-app-muted"
                }`}
                key={status}
                onClick={() => setStatusFilter(status)}
                type="button"
              >
                {status === "All" ? "Все" : formatDealStatus(status)}
              </button>
            );
          })}
        </div>
      </GlassCard>

      <section>
        <SectionHeader
          action={`${filteredDeals.length} показано`}
          eyebrow="Сделки"
          title="Воронка"
        />
        <div className="space-y-5">
          {deals.length === 0 ? (
            <EmptyState
              actionLabel="Добавить сделку"
              description="Добавьте первую возможность и привяжите ее к клиенту."
              onAction={openAddForm}
              title="Сделок пока нет"
            />
          ) : filteredDeals.length === 0 ? (
            <EmptyState
              description="По текущему поиску или статусу сделок не найдено."
              title="Сделки не найдены"
            />
          ) : (
            visibleStages.map((stage) => {
              const stageDeals = dealsByStage.get(stage) ?? [];
              const stageAmount = stageDeals.reduce((total, deal) => total + deal.amount, 0);

              return (
                <section className="space-y-3" key={stage}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white">{formatDealStatus(stage)}</h3>
                      <p className="text-xs text-app-muted">
                        {stageDeals.length} сделок · {moneyFormatter.format(stageAmount)}
                      </p>
                    </div>
                    <Badge tone={getStatusTone(stage)}>{stageDeals.length}</Badge>
                  </div>

                  {stageDeals.length > 0 ? (
                    <div className="space-y-3">
                      {stageDeals.map((deal) => {
                        const nextStatus = getNextStatus(deal.status);
                        const previousStatus = getPreviousStatus(deal.status);

                        return (
                          <GlassCard
                            className="p-4"
                            data-testid="deal-card"
                            data-title={deal.title}
                            interactive
                            key={deal.id}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="truncate font-semibold text-white">{deal.title}</h4>
                                <p className="mt-1 text-sm text-app-muted">
                                  {clientNameById.get(deal.clientId) ?? labels.common.unknownClient}
                                </p>
                                <p className="mt-2 text-xs text-slate-400">
                                  Обновлено {deal.updatedAt} · создано {deal.createdAt}
                                </p>
                              </div>
                              <Badge tone={getStatusTone(deal.status)}>
                                {formatDealStatus(deal.status)}
                              </Badge>
                            </div>
                            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.07] px-3 py-2">
                              <span className="text-xs text-app-muted">Сумма</span>
                              <span className="text-sm font-semibold text-white">
                                {moneyFormatter.format(deal.amount)}
                              </span>
                            </div>
                            <div className="mt-3">
                              <div className="mb-2 flex items-center justify-between text-xs text-app-muted">
                                <span>Вероятность</span>
                                <span>{deal.probability}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-accent-green to-accent-cyan"
                                  style={{ width: `${deal.probability}%` }}
                                />
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <Button
                                disabled={!previousStatus || isSubmitting}
                                onClick={() =>
                                  previousStatus
                                    ? void changeDealStatus(deal, previousStatus)
                                    : undefined
                                }
                                variant="ghost"
                              >
                                Предыдущий этап
                              </Button>
                              <Button
                                disabled={!nextStatus || deal.status === "Lost" || isSubmitting}
                                onClick={() =>
                                  nextStatus ? void changeDealStatus(deal, nextStatus) : undefined
                                }
                                variant="secondary"
                              >
                                Следующий этап
                              </Button>
                              <Button
                                disabled={deal.status === "Paid" || isSubmitting}
                                onClick={() => void changeDealStatus(deal, "Paid")}
                                variant="secondary"
                              >
                                Отметить как оплачено
                              </Button>
                              <Button
                                disabled={deal.status === "Lost" || isSubmitting}
                                onClick={() => void changeDealStatus(deal, "Lost")}
                                variant="ghost"
                              >
                                Отметить как потеряно
                              </Button>
                              <Button
                                disabled={isSubmitting}
                                onClick={() => openEditForm(deal)}
                                variant="secondary"
                              >
                                Изменить
                              </Button>
                              <Button
                                disabled={isSubmitting}
                                onClick={() => setDealToDelete(deal)}
                                variant="danger"
                              >
                                Удалить
                              </Button>
                            </div>
                          </GlassCard>
                        );
                      })}
                    </div>
                  ) : (
                    <GlassCard className="p-4">
                      <p className="text-sm font-medium text-white">
                        Нет сделок на этапе {formatDealStatus(stage)}
                      </p>
                      <p className="mt-1 text-xs text-app-muted">
                        Сделки, переведенные на этот этап, появятся здесь.
                      </p>
                    </GlassCard>
                  )}
                </section>
              );
            })
          )}
        </div>
      </section>

      {formMode ? (
        <div className={modalBackdropClass}>
          <GlassCard className={modalCardClass}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan/80">
                  {formMode === "add" ? "Новая сделка" : "Редактирование сделки"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {formMode === "add" ? "Добавить сделку" : "Обновить сделку"}
                </h2>
              </div>
              <button
                aria-label="Закрыть форму сделки"
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
                  placeholder="Редизайн сайта"
                  required
                  value={form.title}
                />
              </Field>
              <Field label="Сумма">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  min="0"
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  placeholder="120000"
                  required
                  type="number"
                  value={form.amount}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Статус">
                  <select
                    className={inputClass}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value as DealStatus })
                    }
                    value={form.status}
                  >
                    {DEAL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatDealStatus(status)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Вероятность">
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    max="100"
                    min="0"
                    onChange={(event) => setForm({ ...form, probability: event.target.value })}
                    required
                    type="number"
                    value={form.probability}
                  />
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

      {dealToDelete ? (
        <ConfirmDialog
          body={`Удалить "${dealToDelete.title}"? Запись будет удалена из Supabase.`}
          onCancel={() => setDealToDelete(null)}
          onConfirm={() => void confirmDeleteDeal(dealToDelete.id)}
          title="Удалить сделку"
        />
      ) : null}
    </section>
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

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] px-3 py-2">
      <p className="text-xs text-app-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
