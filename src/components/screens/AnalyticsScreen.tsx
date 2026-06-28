import type { Activity, ActivityType, Client, Deal, DealStatus, Task } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";

interface AnalyticsScreenProps {
  activities: Activity[];
  clients: Client[];
  deals: Deal[];
  tasks: Task[];
}

type TaskDueState = "Overdue" | "Today" | "Upcoming";

const DEAL_STATUSES: DealStatus[] = ["New", "Negotiation", "Waiting Payment", "Paid", "Lost"];
const ACTIVE_DEAL_STATUSES = new Set<DealStatus>(["New", "Negotiation", "Waiting Payment"]);
const ACTIVITY_TYPES: ActivityType[] = ["client", "task", "deal", "payment"];

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

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function AnalyticsScreen({ activities, clients, deals, tasks }: AnalyticsScreenProps) {
  const activeDeals = deals.filter((deal) => ACTIVE_DEAL_STATUSES.has(deal.status));
  const paidDeals = deals.filter((deal) => deal.status === "Paid");
  const lostDeals = deals.filter((deal) => deal.status === "Lost");
  const activeTasks = tasks.filter(isTaskActive);
  const doneTasks = tasks.filter(isTaskDone);
  const overdueTasks = activeTasks.filter((task) => getTaskDueState(task) === "Overdue");
  const todayTasks = activeTasks.filter((task) => getTaskDueState(task) === "Today");
  const upcomingTasks = activeTasks.filter((task) => getTaskDueState(task) === "Upcoming");
  const pipelineValue = sumDeals(activeDeals);
  const paidRevenue = sumDeals(paidDeals);
  const lostRevenue = sumDeals(lostDeals);
  const closedDealsCount = paidDeals.length + lostDeals.length;
  const taskCompletionRate = percent(doneTasks.length, tasks.length);
  const dealWinRate = percent(paidDeals.length, closedDealsCount);
  const dealLostRate = percent(lostDeals.length, closedDealsCount);
  const clientsWithDeals = clients.filter((client) =>
    deals.some((deal) => deal.clientId === client.id)
  );
  const clientsWithTasks = clients.filter((client) =>
    tasks.some((task) => task.clientId === client.id)
  );
  const hasAnyAnalytics =
    clients.length > 0 || deals.length > 0 || tasks.length > 0 || activities.length > 0;

  return (
    <section className="space-y-6">
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-cyan/20 blur-2xl" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-app-muted">Business analytics</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">
              {moneyFormatter.format(pipelineValue)}
            </p>
            <p className="mt-1 text-sm text-slate-300">Active pipeline value</p>
          </div>
          <Badge tone="cyan">Live stats</Badge>
        </div>
        {hasAnyAnalytics ? (
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MiniMetric label="Clients" value={clients.length} />
            <MiniMetric label="Deals" value={deals.length} />
            <MiniMetric label="Tasks" value={tasks.length} />
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-app-muted">
            Add clients, deals, tasks, or activities to start building analytics.
          </p>
        )}
      </GlassCard>

      <section>
        <SectionHeader eyebrow="Business" title="Business Overview" />
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            detail="All client rows"
            label="Total Clients"
            tone="blue"
            value={String(clients.length)}
          />
          <StatCard
            detail="All deal rows"
            label="Total Deals"
            tone="purple"
            value={String(deals.length)}
          />
          <StatCard
            detail="New, negotiation, waiting"
            label="Active Deals"
            tone="purple"
            value={String(activeDeals.length)}
          />
          <StatCard
            detail="Active deal amount"
            label="Pipeline Value"
            tone="green"
            value={moneyFormatter.format(pipelineValue)}
          />
          <StatCard
            detail="Paid deals only"
            label="Paid Revenue"
            tone="green"
            value={moneyFormatter.format(paidRevenue)}
          />
          <StatCard
            detail="All task rows"
            label="Total Tasks"
            tone="cyan"
            value={String(tasks.length)}
          />
          <StatCard
            detail="Done status"
            label="Completed Tasks"
            tone="green"
            value={String(doneTasks.length)}
          />
          <StatCard
            detail="Not Done"
            label="Active Tasks"
            tone="cyan"
            value={String(activeTasks.length)}
          />
        </div>
      </section>

      {!hasAnyAnalytics ? (
        <EmptyState
          description="Analytics will appear after the CRM has clients, deals, tasks, or activity rows."
          title="No analytics data yet"
        />
      ) : null}

      <section>
        <SectionHeader action={`${deals.length} total`} eyebrow="Deals" title="Deals Analytics" />
        {deals.length > 0 ? (
          <GlassCard className="p-4">
            <div className="space-y-3">
              {DEAL_STATUSES.map((status) => {
                const stageDeals = deals.filter((deal) => deal.status === status);
                const stageAmount = sumDeals(stageDeals);
                const stageShare = percent(stageDeals.length, deals.length);

                return (
                  <BreakdownRow
                    amount={moneyFormatter.format(stageAmount)}
                    count={stageDeals.length}
                    key={status}
                    label={status}
                    percent={stageShare}
                    tone={getStatusTone(status)}
                  />
                );
              })}
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Create deals to see stage count, value, and share breakdown."
            title="No deals yet"
          />
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Revenue" title="Revenue Analytics" />
        {deals.length > 0 ? (
          <GlassCard className="p-4">
            <div className="space-y-3">
              <ValueRow label="Pipeline Value" value={moneyFormatter.format(pipelineValue)} />
              <ValueRow label="Paid Revenue" value={moneyFormatter.format(paidRevenue)} />
              <ValueRow label="Lost Revenue" value={moneyFormatter.format(lostRevenue)} />
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Revenue analytics will appear after deals are created."
            title="No revenue data"
          />
        )}
      </section>

      <section>
        <SectionHeader action={`${tasks.length} total`} eyebrow="Tasks" title="Tasks Analytics" />
        {tasks.length > 0 ? (
          <GlassCard className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <MiniMetric label="Total" value={tasks.length} />
              <MiniMetric label="Active" value={activeTasks.length} />
              <MiniMetric label="Done" value={doneTasks.length} />
              <MiniMetric label="Overdue" tone="red" value={overdueTasks.length} />
              <MiniMetric label="Today" tone="cyan" value={todayTasks.length} />
              <MiniMetric label="Upcoming" value={upcomingTasks.length} />
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Create tasks to see completion, overdue, today, and upcoming analytics."
            title="No tasks yet"
          />
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Clients" title="Clients Analytics" />
        {clients.length > 0 ? (
          <GlassCard className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <MiniMetric label="Total Clients" value={clients.length} />
              <MiniMetric label="With Deals" value={clientsWithDeals.length} />
              <MiniMetric label="Without Deals" value={clients.length - clientsWithDeals.length} />
              <MiniMetric label="With Tasks" value={clientsWithTasks.length} />
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Add clients to analyze client coverage across deals and tasks."
            title="No clients yet"
          />
        )}
      </section>

      <section>
        <SectionHeader action={`${activities.length} total`} eyebrow="Activity" title="Activity Analytics" />
        {activities.length > 0 ? (
          <GlassCard className="p-4">
            <div className="space-y-3">
              {ACTIVITY_TYPES.map((type) => {
                const count = activities.filter((activity) => activity.type === type).length;

                return <ValueRow key={type} label={`${type} activities`} value={String(count)} />;
              })}
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Activity analytics will appear after client, task, or deal actions."
            title="No activity yet"
          />
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Completion" title="Completion Metrics" />
        {tasks.length > 0 || closedDealsCount > 0 ? (
          <GlassCard className="p-4">
            <div className="space-y-5">
              <MetricRow
                emptyLabel="No tasks yet"
                label="Task Completion Rate"
                value={tasks.length > 0 ? taskCompletionRate : null}
              />
              <MetricRow
                emptyLabel="No closed deals yet"
                label="Deal Win Rate"
                value={closedDealsCount > 0 ? dealWinRate : null}
              />
              <MetricRow
                emptyLabel="No closed deals yet"
                label="Lost Rate"
                value={closedDealsCount > 0 ? dealLostRate : null}
              />
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Complete tasks or close deals as Paid/Lost to calculate completion metrics."
            title="Not enough completion data"
          />
        )}
      </section>
    </section>
  );
}

function BreakdownRow({
  amount,
  count,
  label,
  percent,
  tone
}: {
  amount: string;
  count: number;
  label: string;
  percent: number;
  tone: "blue" | "cyan" | "purple" | "green" | "orange" | "red" | "slate";
}) {
  return (
    <div className="rounded-2xl bg-white/[0.06] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone={tone}>{label}</Badge>
          <p className="mt-2 text-xs text-app-muted">
            {count} deals · {percent}% of total
          </p>
        </div>
        <p className="shrink-0 text-sm font-semibold text-white">{amount}</p>
      </div>
      <ProgressBar value={percent} />
    </div>
  );
}

function MetricRow({
  emptyLabel,
  label,
  value
}: {
  emptyLabel: string;
  label: string;
  value: number | null;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-white">{label}</span>
        <span className="font-semibold text-accent-cyan">
          {value === null ? emptyLabel : `${value}%`}
        </span>
      </div>
      <ProgressBar value={value ?? 0} />
    </div>
  );
}

function MiniMetric({
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

function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.06] px-3 py-2">
      <span className="text-sm text-app-muted">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
