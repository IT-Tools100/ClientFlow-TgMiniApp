import type { Activity, Client, Deal, NavTab, Task } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "USD"
});

export function DashboardScreen({
  activities,
  clients,
  deals,
  onAddClient,
  onOpenTab,
  tasks
}: DashboardScreenProps) {
  const activeDeals = deals.filter((deal) => deal.status !== "Paid" && deal.status !== "Lost");
  const paidDeals = deals.filter((deal) => deal.status === "Paid");
  const todayTasks = tasks.filter((task) => task.status === "Today");
  const overdueTasks = tasks.filter((task) => task.status === "Overdue");
  const revenuePipeline = activeDeals.reduce((total, deal) => total + deal.amount, 0);
  const paidRevenue = paidDeals.reduce((total, deal) => total + deal.amount, 0);
  const clientNameById = new Map(clients.map((client) => [client.id, client.name]));

  const fallbackActivity = [
    ...clients.slice(0, 1).map((client) => ({
      id: `client-${client.id}`,
      title: "Client added",
      description: `${client.name} came from ${client.source}`,
      time: client.createdAt
    })),
    ...tasks.slice(0, 1).map((task) => ({
      id: `task-${task.id}`,
      title: "Task in focus",
      description: `${task.title} for ${clientNameById.get(task.clientId) ?? "Unknown client"}`,
      time: task.dueDate
    })),
    ...deals.slice(0, 1).map((deal) => ({
      id: `deal-${deal.id}`,
      title: "Deal updated",
      description: `${deal.title} · ${moneyFormatter.format(deal.amount)}`,
      time: deal.updatedAt
    }))
  ];
  const recentActivity = activities.length > 0 ? activities.slice(0, 5) : fallbackActivity;

  return (
    <section className="space-y-6">
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-cyan/20 blur-2xl" />
        <p className="text-sm font-medium text-app-muted">Today overview</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-tight text-white">
              {moneyFormatter.format(revenuePipeline)}
            </p>
            <p className="mt-1 text-sm text-slate-300">Revenue pipeline across active deals</p>
          </div>
          <Badge tone={overdueTasks.length > 0 ? "red" : "cyan"}>
            {todayTasks.length} today · {overdueTasks.length} overdue
          </Badge>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button onClick={onAddClient}>Add client</Button>
          <Button onClick={() => onOpenTab("tasks")} variant="secondary">
            View tasks
          </Button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          detail="Current mock state"
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
          detail="Open pipeline"
          label="Pipeline"
          tone="green"
          value={moneyFormatter.format(revenuePipeline)}
        />
        <StatCard
          detail="Paid deals"
          label="Paid revenue"
          tone="green"
          value={moneyFormatter.format(paidRevenue)}
        />
        <StatCard
          detail="Need attention"
          label="Tasks today"
          tone="cyan"
          value={String(todayTasks.length)}
        />
        <StatCard
          detail="Past due"
          label="Overdue"
          tone="purple"
          value={String(overdueTasks.length)}
        />
      </div>

      <section>
        <SectionHeader action="Mock state" eyebrow="Clients" title="Recent clients" />
        <div className="space-y-3">
          {clients.slice(0, 3).map((client) => (
            <GlassCard className="p-4" key={client.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">{client.name}</h3>
                  <p className="mt-1 text-sm text-app-muted">{client.source}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {client.contact} · Created {client.createdAt}
                  </p>
                </div>
                <Badge tone={getStatusTone(client.status)}>{client.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.07] px-3 py-2">
                <span className="text-xs text-app-muted">Client value</span>
                <span className="text-sm font-semibold text-white">
                  {moneyFormatter.format(client.value)}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Focus" title="Today tasks" />
        <div className="space-y-3">
          {todayTasks.length > 0 ? (
            todayTasks.slice(0, 3).map((task) => (
              <GlassCard className="p-4" key={task.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-white">{task.title}</h3>
                    <p className="mt-1 text-sm text-app-muted">
                      {clientNameById.get(task.clientId) ?? "Unknown client"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent-cyan">{task.dueDate}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{task.priority}</p>
                  </div>
                </div>
              </GlassCard>
            ))
          ) : (
            <GlassCard className="p-4">
              <p className="text-sm text-app-muted">No tasks marked Today.</p>
            </GlassCard>
          )}
        </div>
      </section>

      <section>
        <SectionHeader eyebrow="Deals" title="Pipeline pulse" />
        <GlassCard className="p-4">
          <div className="space-y-4">
            {activeDeals.slice(0, 3).map((deal) => (
              <div key={deal.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{deal.title}</p>
                    <p className="text-xs text-app-muted">
                      {clientNameById.get(deal.clientId) ?? "Unknown client"}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-white">
                    {moneyFormatter.format(deal.amount)}
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple"
                    style={{ width: `${deal.probability}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section>
        <SectionHeader eyebrow="Activity" title="Latest updates" />
        <GlassCard className="p-4">
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div className="flex gap-3" key={activity.id}>
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-cyan shadow-[0_0_18px_rgba(34,211,238,0.72)]" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{activity.title}</h3>
                    <span className="text-[11px] text-slate-500">{activity.time}</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-app-muted">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>
    </section>
  );
}
