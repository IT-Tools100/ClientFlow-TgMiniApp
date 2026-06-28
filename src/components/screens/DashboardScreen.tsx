import type { Activity, Client, Deal, DealStatus, NavTab, Task } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";

interface DashboardScreenProps {
  activities: Activity[];
  clients: Client[];
  deals: Deal[];
  onAddClient: () => void;
  onOpenTab: (tab: NavTab) => void;
  tasks: Task[];
}

type TaskDueState = "Overdue" | "Today" | "Upcoming";

const DEAL_STATUSES: DealStatus[] = ["New", "Negotiation", "Waiting Payment", "Paid", "Lost"];
const ACTIVE_DEAL_STATUSES = new Set<DealStatus>(["New", "Negotiation", "Waiting Payment"]);

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

function isTaskDone(task: Task) {
  return task.status === "Done";
}

function isTaskActive(task: Task) {
  return !isTaskDone(task);
}

function sumDeals(deals: Deal[]) {
  return deals.reduce((total, deal) => total + deal.amount, 0);
}

export function DashboardScreen({
  activities,
  clients,
  deals,
  onAddClient,
  onOpenTab,
  tasks
}: DashboardScreenProps) {
  const activeDeals = deals.filter((deal) => ACTIVE_DEAL_STATUSES.has(deal.status));
  const paidDeals = deals.filter((deal) => deal.status === "Paid");
  const lostDeals = deals.filter((deal) => deal.status === "Lost");
  const waitingPaymentDeals = deals.filter((deal) => deal.status === "Waiting Payment");
  const activeTasks = tasks.filter(isTaskActive);
  const doneTasks = tasks.filter(isTaskDone);
  const overdueTasks = activeTasks.filter((task) => getTaskDueState(task) === "Overdue");
  const todayTasks = activeTasks.filter((task) => getTaskDueState(task) === "Today");
  const upcomingTasks = activeTasks.filter((task) => getTaskDueState(task) === "Upcoming");
  const activePipelineAmount = sumDeals(activeDeals);
  const paidRevenue = sumDeals(paidDeals);
  const clientNameById = new Map(clients.map((client) => [client.id, client.name]));
  const recentActivity = activities.slice(0, 5);
  const focusTasks = [...overdueTasks, ...todayTasks].slice(0, 4);
  const focusDeals = waitingPaymentDeals.slice(0, 3);
  const hasUrgentFocus = focusTasks.length > 0 || focusDeals.length > 0;

  return (
    <section className="space-y-6">
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-cyan/20 blur-2xl" />
        <p className="text-sm font-medium text-app-muted">CRM command center</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-tight text-white">
              {moneyFormatter.format(activePipelineAmount)}
            </p>
            <p className="mt-1 text-sm text-slate-300">Active pipeline amount</p>
          </div>
          <Badge tone={overdueTasks.length > 0 ? "red" : "cyan"}>
            {todayTasks.length} today · {overdueTasks.length} overdue
          </Badge>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button onClick={onAddClient}>Add Client</Button>
          <Button onClick={() => onOpenTab("tasks")} variant="secondary">
            Open Tasks
          </Button>
          <Button onClick={() => onOpenTab("deals")} variant="secondary">
            Open Deals
          </Button>
          <Button onClick={() => onOpenTab("deals")} variant="ghost">
            Open Pipeline
          </Button>
        </div>
        {overdueTasks.length > 0 ? (
          <Button className="mt-3 w-full" onClick={() => onOpenTab("tasks")} variant="ghost">
            Open Overdue Tasks
          </Button>
        ) : null}
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          detail="Real client rows"
          label="Total clients"
          tone="blue"
          value={String(clients.length)}
        />
        <StatCard
          detail="New, negotiation, waiting"
          label="Active deals"
          tone="purple"
          value={String(activeDeals.length)}
        />
        <StatCard
          detail="Excludes paid and lost"
          label="Active pipeline"
          tone="green"
          value={moneyFormatter.format(activePipelineAmount)}
        />
        <StatCard
          detail="Paid deals only"
          label="Paid revenue"
          tone="green"
          value={moneyFormatter.format(paidRevenue)}
        />
        <StatCard
          detail="Not Done"
          label="Active tasks"
          tone="cyan"
          value={String(activeTasks.length)}
        />
        <StatCard
          detail="Active and past due"
          label="Overdue tasks"
          tone="purple"
          value={String(overdueTasks.length)}
        />
        <StatCard
          detail="Active and due today"
          label="Today tasks"
          tone="cyan"
          value={String(todayTasks.length)}
        />
      </div>

      {clients.length === 0 ? (
        <EmptyState
          actionLabel="Add Client"
          description="Create the first client to connect tasks, deals, and activity."
          onAction={onAddClient}
          title="No clients yet"
        />
      ) : null}

      <section>
        <SectionHeader action="Urgent work" eyebrow="Focus" title="Focus Today" />
        {hasUrgentFocus ? (
          <div className="space-y-3">
            {focusTasks.map((task) => {
              const dueState = getTaskDueState(task);

              return (
                <GlassCard className="p-4" key={task.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">{task.title}</h3>
                      <p className="mt-1 text-sm text-app-muted">
                        {clientNameById.get(task.clientId) ?? "Unknown client"}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Due {normalizeDateKey(task.dueDate) || "not set"} · {task.priority}
                      </p>
                    </div>
                    <Badge tone={getStatusTone(dueState)}>{dueState}</Badge>
                  </div>
                </GlassCard>
              );
            })}

            {focusDeals.map((deal) => (
              <GlassCard className="p-4" key={deal.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{deal.title}</h3>
                    <p className="mt-1 text-sm text-app-muted">
                      {clientNameById.get(deal.clientId) ?? "Unknown client"}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {deal.probability}% probability
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={getStatusTone(deal.status)}>{deal.status}</Badge>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {moneyFormatter.format(deal.amount)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <EmptyState
            description="No overdue tasks, tasks due today, or waiting payment deals right now."
            title="Nothing urgent"
          />
        )}
      </section>

      <section>
        <SectionHeader action={`${tasks.length} total`} eyebrow="Tasks" title="Task snapshot" />
        {tasks.length > 0 ? (
          <GlassCard className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <SnapshotMetric label="Active" value={activeTasks.length} />
              <SnapshotMetric label="Done" value={doneTasks.length} />
              <SnapshotMetric label="Overdue" tone="red" value={overdueTasks.length} />
              <SnapshotMetric label="Today" tone="cyan" value={todayTasks.length} />
              <SnapshotMetric label="Upcoming" value={upcomingTasks.length} />
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            actionLabel="Open Tasks"
            description="Create tasks to track today, overdue, and upcoming work."
            onAction={() => onOpenTab("tasks")}
            title="No tasks yet"
          />
        )}
      </section>

      <section>
        <SectionHeader action={`${deals.length} total`} eyebrow="Deals" title="Pipeline snapshot" />
        {deals.length > 0 ? (
          <GlassCard className="p-4">
            <div className="space-y-3">
              {DEAL_STATUSES.map((status) => {
                const stageDeals = deals.filter((deal) => deal.status === status);
                const stageAmount = sumDeals(stageDeals);

                return (
                  <div
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.06] px-3 py-2"
                    key={status}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone={getStatusTone(status)}>{status}</Badge>
                        <span className="text-xs text-app-muted">{stageDeals.length}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{stageDeals.length} deals</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-white">
                      {moneyFormatter.format(stageAmount)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.08] px-3 py-2">
              <span className="text-xs text-app-muted">Lost amount</span>
              <span className="text-sm font-semibold text-white">
                {moneyFormatter.format(sumDeals(lostDeals))}
              </span>
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            actionLabel="Open Deals"
            description="Create deals to see the pipeline by stage."
            onAction={() => onOpenTab("deals")}
            title="No deals yet"
          />
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Activity" title="Recent Activity" />
        {recentActivity.length > 0 ? (
          <GlassCard className="p-4">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div className="flex gap-3" key={activity.id}>
                  <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-cyan shadow-[0_0_18px_rgba(34,211,238,0.72)]" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{activity.title}</h3>
                      <span className="text-[11px] text-slate-500">{activity.time}</span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-app-muted">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Create or update clients, tasks, and deals to see recent activity here."
            title="No activity yet"
          />
        )}
      </section>
    </section>
  );
}

function SnapshotMetric({
  label,
  tone = "slate",
  value
}: {
  label: string;
  tone?: "cyan" | "red" | "slate";
  value: number;
}) {
  const toneClass =
    tone === "red" ? "text-rose-100" : tone === "cyan" ? "text-cyan-50" : "text-white";

  return (
    <div className="rounded-2xl bg-white/[0.07] px-3 py-2">
      <p className="text-xs text-app-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
