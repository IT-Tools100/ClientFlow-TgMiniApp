"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Client, ClientStatus } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { ClientUpsertInput } from "@/lib/services/clients";

const CLIENT_STATUSES: ClientStatus[] = [
  "New",
  "Contacted",
  "In Progress",
  "Waiting Payment",
  "Paid",
  "Lost"
];

type StatusFilter = "All" | ClientStatus;

interface ClientFormState {
  name: string;
  contact: string;
  source: string;
  status: ClientStatus;
  value: string;
  notes: string;
}

const emptyForm: ClientFormState = {
  name: "",
  contact: "",
  source: "",
  status: "New",
  value: "",
  notes: ""
};

const inputClass =
  "min-h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-accent-cyan/60 focus:ring-2 focus:ring-accent-cyan/15";

const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "USD"
});

function clientToForm(client: Client): ClientFormState {
  return {
    name: client.name,
    contact: client.contact,
    source: client.source,
    status: client.status,
    value: String(client.value),
    notes: client.notes
  };
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

interface ClientsScreenProps {
  addClientRequest?: number;
  clients: Client[];
  onCreateClient: (input: ClientUpsertInput) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onUpdateClient: (id: string, input: ClientUpsertInput) => Promise<void>;
}

export function ClientsScreen({
  addClientRequest = 0,
  clients,
  onCreateClient,
  onDeleteClient,
  onUpdateClient
}: ClientsScreenProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesQuery =
        client.name.toLowerCase().includes(normalizedQuery) ||
        client.contact.toLowerCase().includes(normalizedQuery) ||
        client.source.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || client.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [clients, query, statusFilter]);

  const totalValue = useMemo(
    () => clients.reduce((total, client) => total + client.value, 0),
    [clients]
  );

  function openAddForm() {
    setForm(emptyForm);
    setEditingClientId(null);
    setSelectedClient(null);
    setFormMode("add");
  }

  function openEditForm(client: Client) {
    setForm(clientToForm(client));
    setEditingClientId(client.id);
    setFormMode("edit");
    setSelectedClient(null);
  }

  function closeForm() {
    setFormMode(null);
    setEditingClientId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);

    try {
      const input = formToInput(form);

      if (formMode === "edit" && editingClientId) {
        await onUpdateClient(editingClientId, input);
      } else {
        await onCreateClient(input);
      }
      closeForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDeleteClient(clientId: string) {
    setIsSubmitting(true);

    try {
      await onDeleteClient(clientId);
      if (selectedClient?.id === clientId) {
        setSelectedClient(null);
      }
      if (editingClientId === clientId) {
        closeForm();
      }
      setClientToDelete(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (addClientRequest > 0) {
      setForm(emptyForm);
      setEditingClientId(null);
      setSelectedClient(null);
      setFormMode("add");
    }
  }, [addClientRequest]);

  return (
    <section className="space-y-5">
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-blue/20 blur-2xl" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-app-muted">Client workspace</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">{clients.length}</p>
            <p className="mt-1 text-sm text-slate-300">
              {moneyFormatter.format(totalValue)} total client value
            </p>
          </div>
          <Button onClick={openAddForm}>Add Client</Button>
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <div className="space-y-3">
          <input
            className={inputClass}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, contact, source"
            type="search"
            value={query}
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["All", ...CLIENT_STATUSES] as StatusFilter[]).map((status) => {
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
        </div>
      </GlassCard>

      <section>
        <SectionHeader
          action={`${filteredClients.length} shown`}
          eyebrow="CRM"
          title="Clients"
        />
        <div className="space-y-3">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <GlassCard className="p-4" key={client.id}>
                <div className="flex items-start justify-between gap-3">
                  <button
                    className="tap-highlight min-w-0 flex-1 text-left"
                    onClick={() => setSelectedClient(client)}
                    type="button"
                  >
                    <h3 className="truncate font-semibold text-white">{client.name}</h3>
                    <p className="mt-1 truncate text-sm text-app-muted">{client.contact}</p>
                    <p className="mt-2 text-xs text-slate-400">
                      {client.source} · {client.createdAt}
                    </p>
                  </button>
                  <Badge tone={getStatusTone(client.status)}>{client.status}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.07] px-3 py-2">
                  <span className="text-xs text-app-muted">Value</span>
                  <span className="text-sm font-semibold text-white">
                    {moneyFormatter.format(client.value)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Button onClick={() => setSelectedClient(client)} variant="ghost">
                    Details
                  </Button>
                  <Button onClick={() => openEditForm(client)} variant="secondary">
                    Edit
                  </Button>
                  <Button
                    className="border border-accent-red/30 bg-accent-red/[0.12] text-rose-100 hover:bg-accent-red/[0.18]"
                    onClick={() => setClientToDelete(client)}
                    variant="ghost"
                  >
                    Delete
                  </Button>
                </div>
              </GlassCard>
            ))
          ) : (
            <EmptyState
              actionLabel="Add Client"
              description={
                clients.length === 0
                  ? "Start your client base with the first lead, contact, source, and deal value."
                  : "No clients match the current search or status filter. Try clearing the query."
              }
              onAction={openAddForm}
              title={clients.length === 0 ? "No clients yet" : "No client results"}
            />
          )}
        </div>
      </section>

      {selectedClient ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/55 px-4 pb-24 backdrop-blur-sm">
          <GlassCard className="mx-auto w-full max-w-md p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan/80">
                  Client detail
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">{selectedClient.name}</h2>
              </div>
              <button
                aria-label="Close client details"
                className="tap-highlight rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => setSelectedClient(null)}
                type="button"
              >
                Close
              </button>
            </div>
            <div className="mt-5 space-y-3">
              <DetailRow label="Contact" value={selectedClient.contact} />
              <DetailRow label="Source" value={selectedClient.source} />
              <DetailRow label="Value" value={moneyFormatter.format(selectedClient.value)} />
              <DetailRow label="Created" value={selectedClient.createdAt} />
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3">
                <p className="mb-2 text-xs text-app-muted">Status</p>
                <Badge tone={getStatusTone(selectedClient.status)}>{selectedClient.status}</Badge>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3">
                <p className="mb-2 text-xs text-app-muted">Notes</p>
                <p className="text-sm leading-6 text-white">
                  {selectedClient.notes || "No notes yet."}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Button onClick={() => openEditForm(selectedClient)} variant="secondary">
                Edit
              </Button>
              <Button
                className="border border-accent-red/30 bg-accent-red/[0.12] text-rose-100 hover:bg-accent-red/[0.18]"
                onClick={() => setClientToDelete(selectedClient)}
                variant="ghost"
              >
                Delete
              </Button>
            </div>
          </GlassCard>
        </div>
      ) : null}

      {formMode ? (
        <div className="fade-enter fixed inset-0 z-50 flex items-end bg-black/55 px-4 pb-24 backdrop-blur-sm">
          <GlassCard className="modal-enter mx-auto max-h-[82vh] w-full max-w-md overflow-y-auto p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan/80">
                  {formMode === "add" ? "New client" : "Edit client"}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {formMode === "add" ? "Add Client" : "Update Client"}
                </h2>
              </div>
              <button
                aria-label="Close client form"
                className="tap-highlight rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white"
                onClick={closeForm}
                type="button"
              >
                Close
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Name">
                <input
                  className={inputClass}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Mila Petrova"
                  required
                  value={form.name}
                />
              </Field>
              <Field label="Contact">
                <input
                  className={inputClass}
                  onChange={(event) => setForm({ ...form, contact: event.target.value })}
                  placeholder="@username or phone"
                  required
                  value={form.contact}
                />
              </Field>
              <Field label="Source">
                <input
                  className={inputClass}
                  onChange={(event) => setForm({ ...form, source: event.target.value })}
                  placeholder="Telegram, Referral, Instagram"
                  required
                  value={form.source}
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputClass}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value as ClientStatus })
                  }
                  value={form.status}
                >
                  {CLIENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Value">
                <input
                  className={inputClass}
                  inputMode="numeric"
                  min="0"
                  onChange={(event) => setForm({ ...form, value: event.target.value })}
                  placeholder="95000"
                  required
                  type="number"
                  value={form.value}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  className={`${inputClass} min-h-28 resize-none py-3`}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Short context, next steps, agreements"
                  value={form.notes}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button disabled={isSubmitting} onClick={closeForm} variant="ghost">
                  Cancel
                </Button>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Saving..." : formMode === "add" ? "Create" : "Save"}
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      ) : null}

      {clientToDelete ? (
        <ConfirmDialog
          body={`Delete ${clientToDelete.name}? This removes it from Supabase.`}
          onCancel={() => setClientToDelete(null)}
          onConfirm={() => void confirmDeleteClient(clientToDelete.id)}
          title="Delete client"
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3">
      <span className="text-xs text-app-muted">{label}</span>
      <span className="min-w-0 truncate text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function formToInput(form: ClientFormState): ClientUpsertInput {
  return {
    name: form.name.trim(),
    contact: form.contact.trim(),
    source: form.source.trim(),
    status: form.status,
    value: Number(form.value) || 0,
    notes: form.notes.trim()
  };
}
