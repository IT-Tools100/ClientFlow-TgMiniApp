"use client";

import { FormEvent, useMemo, useState } from "react";
import type { Client, Deal, DealStatus } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { DealUpsertInput } from "@/lib/services/deals";

const DEAL_STATUSES: DealStatus[] = ["New", "Negotiation", "Waiting Payment", "Paid", "Lost"];

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

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-accent-cyan/60 focus:ring-2 focus:ring-accent-cyan/15";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "USD"
});

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

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

export function DealsScreen({
  clients,
  deals,
  onCreateDeal,
  onDeleteDeal,
  onUpdateDeal
}: DealsScreenProps) {
  const defaultClientId = clients[0]?.id ?? "";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [form, setForm] = useState<DealFormState>(() => createEmptyForm(defaultClientId));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, client.name])),
    [clients]
  );

  const filteredDeals = useMemo(
    () =>
      deals.filter((deal) => statusFilter === "All" || deal.status === statusFilter),
    [deals, statusFilter]
  );

  const activePipeline = deals
    .filter((deal) => deal.status !== "Paid" && deal.status !== "Lost")
    .reduce((total, deal) => total + deal.amount, 0);
  const paidRevenue = deals
    .filter((deal) => deal.status === "Paid")
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

  return (
    <section className="space-y-5">
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-green/20 blur-2xl" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-app-muted">Deal pipeline</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">
              {moneyFormatter.format(activePipeline)}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              {moneyFormatter.format(paidRevenue)} paid revenue
            </p>
          </div>
          <Button onClick={openAddForm}>Add Deal</Button>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
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
                {status}
              </button>
            );
          })}
        </div>
      </GlassCard>

      <section>
        <SectionHeader
          action={`${filteredDeals.length} shown`}
          eyebrow="Deals"
          title="Pipeline"
        />
        <div className="space-y-3">
          {filteredDeals.length > 0 ? (
            filteredDeals.map((deal) => (
              <GlassCard
                className="p-4"
                data-testid="deal-card"
                data-title={deal.title}
                key={deal.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{deal.title}</h3>
                    <p className="mt-1 text-sm text-app-muted">
                      {clientNameById.get(deal.clientId) ?? "Unknown client"}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Updated {deal.updatedAt} · Created {deal.createdAt}
                    </p>
                  </div>
                  <Badge tone={getStatusTone(deal.status)}>{deal.status}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.07] px-3 py-2">
                  <span className="text-xs text-app-muted">Amount</span>
                  <span className="text-sm font-semibold text-white">
                    {moneyFormatter.format(deal.amount)}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-app-muted">
                    <span>Probability</span>
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
                  <Button onClick={() => openEditForm(deal)} variant="secondary">
                    Edit
                  </Button>
                  <Button
                    className="border border-accent-red/30 bg-accent-red/[0.12] text-rose-100 hover:bg-accent-red/[0.18]"
                    onClick={() => setDealToDelete(deal)}
                    variant="ghost"
                  >
                    Delete
                  </Button>
                </div>
              </GlassCard>
            ))
          ) : (
            <EmptyState
              actionLabel="Add Deal"
              description={
                deals.length === 0
                  ? "Add the first opportunity and connect it to a client in the demo pipeline."
                  : "No deals match this status filter. Switch status to review the full pipeline."
              }
              onAction={openAddForm}
              title={deals.length === 0 ? "No deals yet" : "No deal results"}
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
                  {formMode === "add" ? "New deal" : "Edit deal"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {formMode === "add" ? "Add Deal" : "Update Deal"}
                </h2>
              </div>
              <button
                aria-label="Close deal form"
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
                  placeholder="Website redesign"
                  required
                  value={form.title}
                />
              </Field>
              <Field label="Amount">
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
                <Field label="Status">
                  <select
                    className={inputClass}
                    onChange={(event) =>
                      setForm({ ...form, status: event.target.value as DealStatus })
                    }
                    value={form.status}
                  >
                    {DEAL_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Probability">
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

      {dealToDelete ? (
        <ConfirmDialog
          body={`Delete "${dealToDelete.title}"? This removes it from Supabase.`}
          onCancel={() => setDealToDelete(null)}
          onConfirm={() => void confirmDeleteDeal(dealToDelete.id)}
          title="Delete deal"
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
