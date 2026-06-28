"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  Activity,
  Client,
  ClientStatus,
  Deal,
  DealStatus,
  Task,
  TaskPriority,
  TaskStatus
} from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getActivitiesByClientId } from "@/lib/services/activities";
import type { ClientUpsertInput } from "@/lib/services/clients";
import { getClientById } from "@/lib/services/clients";
import { getDealsByClientId, type DealUpsertInput } from "@/lib/services/deals";
import { getTasksByClientId, type TaskUpsertInput } from "@/lib/services/tasks";

const CLIENT_STATUSES: ClientStatus[] = [
  "New",
  "Contacted",
  "In Progress",
  "Waiting Payment",
  "Paid",
  "Lost"
];
const TASK_STATUSES: TaskStatus[] = ["Today", "Upcoming", "Done", "Overdue"];
const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];
const DEAL_STATUSES: DealStatus[] = ["New", "Negotiation", "Waiting Payment", "Paid", "Lost"];

type StatusFilter = "All" | ClientStatus;

interface ClientFormState {
  name: string;
  contact: string;
  source: string;
  status: ClientStatus;
  value: string;
  notes: string;
}

interface QuickTaskFormState {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
}

interface QuickDealFormState {
  title: string;
  amount: string;
  status: DealStatus;
  probability: string;
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

function createQuickTaskForm(): QuickTaskFormState {
  return {
    title: "",
    description: "",
    dueDate: todayIsoDate(),
    status: "Today",
    priority: "Medium"
  };
}

function createQuickDealForm(): QuickDealFormState {
  return {
    title: "",
    amount: "",
    status: "New",
    probability: "40"
  };
}

interface ClientsScreenProps {
  addClientRequest?: number;
  clients: Client[];
  currentProfileId: string;
  onCreateClient: (input: ClientUpsertInput) => Promise<void>;
  onCreateDeal: (input: DealUpsertInput) => Promise<void>;
  onCreateTask: (input: TaskUpsertInput) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  openClientRequest?: {
    clientId: string;
    requestId: number;
  } | null;
  onUpdateClient: (id: string, input: ClientUpsertInput) => Promise<void>;
}

export function ClientsScreen({
  addClientRequest = 0,
  clients,
  currentProfileId,
  onCreateClient,
  onCreateDeal,
  onCreateTask,
  onDeleteClient,
  openClientRequest,
  onUpdateClient
}: ClientsScreenProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<Client | null>(null);
  const [clientTasks, setClientTasks] = useState<Task[]>([]);
  const [clientDeals, setClientDeals] = useState<Deal[]>([]);
  const [clientActivities, setClientActivities] = useState<Activity[]>([]);
  const [clientDetailsError, setClientDetailsError] = useState<string | null>(null);
  const [isClientDetailsLoading, setIsClientDetailsLoading] = useState(false);
  const [clientDetailsReloadKey, setClientDetailsReloadKey] = useState(0);
  const [quickFormMode, setQuickFormMode] = useState<"task" | "deal" | null>(null);
  const [quickTaskForm, setQuickTaskForm] = useState<QuickTaskFormState>(() => createQuickTaskForm());
  const [quickDealForm, setQuickDealForm] = useState<QuickDealFormState>(createQuickDealForm);
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

  function refreshClientWorkspace() {
    setClientDetailsReloadKey((value) => value + 1);
  }

  function openClientWorkspace(client: Client) {
    setSelectedClientId(client.id);
    setClientDetails(client);
    setClientTasks([]);
    setClientDeals([]);
    setClientActivities([]);
    setClientDetailsError(null);
    setQuickFormMode(null);
  }

  function closeClientWorkspace() {
    setSelectedClientId(null);
    setClientDetails(null);
    setClientTasks([]);
    setClientDeals([]);
    setClientActivities([]);
    setClientDetailsError(null);
    setQuickFormMode(null);
  }

  function openAddForm() {
    setForm(emptyForm);
    setEditingClientId(null);
    closeClientWorkspace();
    setFormMode("add");
  }

  function openEditForm(client: Client) {
    setForm(clientToForm(client));
    setEditingClientId(client.id);
    setFormMode("edit");
    closeClientWorkspace();
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

  async function handleQuickTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClientId) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateTask({
        clientId: selectedClientId,
        title: quickTaskForm.title,
        description: quickTaskForm.description,
        dueDate: quickTaskForm.dueDate,
        status: quickTaskForm.status,
        priority: quickTaskForm.priority
      });
      setQuickTaskForm(createQuickTaskForm());
      setQuickFormMode(null);
      refreshClientWorkspace();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleQuickDealSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClientId) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateDeal({
        clientId: selectedClientId,
        title: quickDealForm.title,
        amount: Number(quickDealForm.amount) || 0,
        status: quickDealForm.status,
        probability: Math.min(100, Math.max(0, Number(quickDealForm.probability) || 0))
      });
      setQuickDealForm(createQuickDealForm());
      setQuickFormMode(null);
      refreshClientWorkspace();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDeleteClient(clientId: string) {
    setIsSubmitting(true);

    try {
      await onDeleteClient(clientId);
      if (selectedClientId === clientId) {
        closeClientWorkspace();
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
      closeClientWorkspace();
      setFormMode("add");
    }
  }, [addClientRequest]);

  useEffect(() => {
    if (!openClientRequest) {
      return;
    }

    const requestedClient = clients.find((client) => client.id === openClientRequest.clientId);

    if (requestedClient) {
      openClientWorkspace(requestedClient);
    }
    // openClientWorkspace intentionally resets local workspace state for each external request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, openClientRequest?.clientId, openClientRequest?.requestId]);

  useEffect(() => {
    let alive = true;

    if (selectedClientId) {
      setIsClientDetailsLoading(true);
      setClientDetailsError(null);

      Promise.all([
        getClientById(currentProfileId, selectedClientId),
        getTasksByClientId(currentProfileId, selectedClientId),
        getDealsByClientId(currentProfileId, selectedClientId),
        getActivitiesByClientId(currentProfileId, selectedClientId)
      ])
        .then(([details, relatedTasks, relatedDeals, relatedActivities]) => {
          if (!alive) {
            return;
          }

          setClientDetails(details);
          setClientTasks(relatedTasks);
          setClientDeals(relatedDeals);
          setClientActivities(relatedActivities);
        })
        .catch((error) => {
          if (!alive) {
            return;
          }

          setClientDetailsError(
            error instanceof Error ? error.message : "Failed to load client workspace"
          );
        })
        .finally(() => {
          if (alive) {
            setIsClientDetailsLoading(false);
          }
        });
    }

    return () => {
      alive = false;
    };
  }, [clientDetailsReloadKey, currentProfileId, selectedClientId]);

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
                    onClick={() => openClientWorkspace(client)}
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
                  <Button onClick={() => openClientWorkspace(client)} variant="ghost">
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

      {selectedClientId ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/55 px-4 pb-24 backdrop-blur-sm">
          <GlassCard className="modal-enter mx-auto max-h-[86vh] w-full max-w-md overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-cyan/80">
                  Client workspace
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  {clientDetails?.name ?? "Client"}
                </h2>
              </div>
              <button
                aria-label="Close client workspace"
                className="tap-highlight rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white"
                onClick={closeClientWorkspace}
                type="button"
              >
                Close
              </button>
            </div>

            {clientDetailsError ? (
              <div className="mt-5 rounded-2xl border border-accent-red/30 bg-accent-red/[0.12] p-4">
                <p className="text-sm leading-6 text-rose-100">{clientDetailsError}</p>
                <Button className="mt-3 w-full" onClick={refreshClientWorkspace} variant="ghost">
                  Retry
                </Button>
              </div>
            ) : null}

            {clientDetails ? (
              <>
                <div className="mt-5 space-y-3">
                  <DetailRow label="Contact" value={clientDetails.contact || "Not specified"} />
                  <DetailRow label="Source" value={clientDetails.source || "Not specified"} />
                  <DetailRow label="Value" value={moneyFormatter.format(clientDetails.value)} />
                  <DetailRow label="Created" value={formatDateTime(clientDetails.createdAt)} />
                  <DetailRow label="Updated" value={formatDateTime(clientDetails.updatedAt)} />
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3">
                    <p className="mb-2 text-xs text-app-muted">Status</p>
                    <Badge tone={getStatusTone(clientDetails.status)}>{clientDetails.status}</Badge>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3">
                    <p className="mb-2 text-xs text-app-muted">Notes</p>
                    <p className="text-sm leading-6 text-white">
                      {clientDetails.notes || "No notes yet."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button onClick={() => openEditForm(clientDetails)} variant="secondary">
                    Edit
                  </Button>
                  <Button
                    className="border border-accent-red/30 bg-accent-red/[0.12] text-rose-100 hover:bg-accent-red/[0.18]"
                    onClick={() => setClientToDelete(clientDetails)}
                    variant="ghost"
                  >
                    Delete
                  </Button>
                  <Button onClick={() => setQuickFormMode("task")} variant="secondary">
                    Add Task
                  </Button>
                  <Button onClick={() => setQuickFormMode("deal")} variant="secondary">
                    Add Deal
                  </Button>
                </div>

                {quickFormMode === "task" ? (
                  <QuickTaskForm
                    form={quickTaskForm}
                    isSubmitting={isSubmitting}
                    onCancel={() => setQuickFormMode(null)}
                    onChange={setQuickTaskForm}
                    onSubmit={handleQuickTaskSubmit}
                  />
                ) : null}

                {quickFormMode === "deal" ? (
                  <QuickDealForm
                    form={quickDealForm}
                    isSubmitting={isSubmitting}
                    onCancel={() => setQuickFormMode(null)}
                    onChange={setQuickDealForm}
                    onSubmit={handleQuickDealSubmit}
                  />
                ) : null}

                <ClientWorkspaceSection
                  emptyDescription="There are no Supabase tasks connected to this client yet."
                  emptyTitle="No client tasks"
                  isLoading={isClientDetailsLoading}
                  itemCount={clientTasks.length}
                  title="Tasks"
                >
                  {clientTasks.map((task) => (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3" key={task.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{task.title}</p>
                          <p className="mt-1 text-xs leading-5 text-app-muted">
                            {task.description || "No description."}
                          </p>
                        </div>
                        <Badge tone={getStatusTone(task.status)}>{task.status}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <InfoPill label="Due" value={task.dueDate} />
                        <InfoPill label="Priority" value={task.priority} />
                      </div>
                    </div>
                  ))}
                </ClientWorkspaceSection>

                <ClientWorkspaceSection
                  emptyDescription="There are no Supabase deals connected to this client yet."
                  emptyTitle="No client deals"
                  isLoading={isClientDetailsLoading}
                  itemCount={clientDeals.length}
                  title="Deals"
                >
                  {clientDeals.map((deal) => (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3" key={deal.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">{deal.title}</p>
                          <p className="mt-1 text-xs text-app-muted">
                            {moneyFormatter.format(deal.amount)} · {deal.probability}%
                          </p>
                        </div>
                        <Badge tone={getStatusTone(deal.status)}>{deal.status}</Badge>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        Updated {formatDateTime(deal.updatedAt)}
                      </p>
                    </div>
                  ))}
                </ClientWorkspaceSection>

                <ClientWorkspaceSection
                  emptyDescription="There is no Supabase activity history for this client yet."
                  emptyTitle="No client activity"
                  isLoading={isClientDetailsLoading}
                  itemCount={clientActivities.length}
                  title="Activity"
                >
                  {clientActivities.map((activity) => (
                    <div className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3" key={activity.id}>
                      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-cyan shadow-[0_0_18px_rgba(34,211,238,0.72)]" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-white">{activity.title}</p>
                          <span className="text-[11px] text-slate-500">{activity.time}</span>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-app-muted">
                          {activity.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </ClientWorkspaceSection>
              </>
            ) : (
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <p className="text-sm text-app-muted">Loading client workspace...</p>
              </div>
            )}
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

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] px-3 py-2">
      <p className="text-[11px] text-app-muted">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold text-white">{value}</p>
    </div>
  );
}

function ClientWorkspaceSection({
  children,
  emptyDescription,
  emptyTitle,
  isLoading,
  itemCount,
  title
}: {
  children: React.ReactNode;
  emptyDescription: string;
  emptyTitle: string;
  isLoading: boolean;
  itemCount: number;
  title: string;
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <span className="text-xs font-semibold text-app-muted">{itemCount}</span>
      </div>
      {itemCount > 0 ? <div className="space-y-3">{children}</div> : null}
      {itemCount === 0 && !isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-sm font-semibold text-white">{emptyTitle}</p>
          <p className="mt-1 text-sm leading-5 text-app-muted">{emptyDescription}</p>
        </div>
      ) : null}
      {itemCount === 0 && isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
          <p className="text-sm text-app-muted">Loading...</p>
        </div>
      ) : null}
    </section>
  );
}

function QuickTaskForm({
  form,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit
}: {
  form: QuickTaskFormState;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: (form: QuickTaskFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4" onSubmit={onSubmit}>
      <p className="text-sm font-semibold text-white">Quick task</p>
      <Field label="Title">
        <input
          className={inputClass}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          placeholder="Follow up with client"
          required
          value={form.title}
        />
      </Field>
      <Field label="Description">
        <textarea
          className={`${inputClass} min-h-24 resize-none py-3`}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          placeholder="What needs to be done?"
          value={form.description}
        />
      </Field>
      <Field label="Due date">
        <input
          className={inputClass}
          onChange={(event) => onChange({ ...form, dueDate: event.target.value })}
          required
          type="date"
          value={form.dueDate}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select
            className={inputClass}
            onChange={(event) => onChange({ ...form, status: event.target.value as TaskStatus })}
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
              onChange({ ...form, priority: event.target.value as TaskPriority })
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
      <div className="grid grid-cols-2 gap-3">
        <Button disabled={isSubmitting} onClick={onCancel} variant="ghost">
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Create Task"}
        </Button>
      </div>
    </form>
  );
}

function QuickDealForm({
  form,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit
}: {
  form: QuickDealFormState;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: (form: QuickDealFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="mt-5 space-y-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4" onSubmit={onSubmit}>
      <p className="text-sm font-semibold text-white">Quick deal</p>
      <Field label="Title">
        <input
          className={inputClass}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
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
          onChange={(event) => onChange({ ...form, amount: event.target.value })}
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
            onChange={(event) => onChange({ ...form, status: event.target.value as DealStatus })}
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
            onChange={(event) => onChange({ ...form, probability: event.target.value })}
            required
            type="number"
            value={form.probability}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button disabled={isSubmitting} onClick={onCancel} variant="ghost">
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving..." : "Create Deal"}
        </Button>
      </div>
    </form>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
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
