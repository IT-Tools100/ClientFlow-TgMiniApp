import type { Client, Deal, Task } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";

interface AnalyticsScreenProps {
  clients: Client[];
  deals: Deal[];
  tasks: Task[];
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "USD"
});

export function AnalyticsScreen({ clients, deals, tasks }: AnalyticsScreenProps) {
  const paidClients = clients.filter((client) => client.status === "Paid").length;
  const lostClients = clients.filter((client) => client.status === "Lost").length;
  const activeDeals = deals.filter((deal) => deal.status !== "Paid" && deal.status !== "Lost");
  const paidDeals = deals.filter((deal) => deal.status === "Paid");
  const completedTasks = tasks.filter((task) => task.status === "Done").length;

  const conversionRate = clients.length > 0 ? Math.round((paidClients / clients.length) * 100) : 0;
  const taskCompletionRate =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const revenuePipeline = activeDeals.reduce((total, deal) => total + deal.amount, 0);
  const paidRevenue = paidDeals.reduce((total, deal) => total + deal.amount, 0);

  return (
    <section className="space-y-6">
      <GlassCard className="p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent-cyan/20 blur-2xl" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-app-muted">Business pulse</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">
              {conversionRate}%
            </p>
            <p className="mt-1 text-sm text-slate-300">Client conversion rate in demo data</p>
          </div>
          <Badge tone="cyan">Demo analytics</Badge>
        </div>
        <ProgressBar value={conversionRate} />
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <StatCard detail="All contacts" label="Total clients" tone="blue" value={String(clients.length)} />
        <StatCard detail="Paid status" label="Paid clients" tone="green" value={String(paidClients)} />
        <StatCard detail="Lost status" label="Lost clients" tone="purple" value={String(lostClients)} />
        <StatCard detail="Done tasks" label="Task completion" tone="cyan" value={`${taskCompletionRate}%`} />
        <StatCard
          detail="Active deals"
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
      </div>

      <section>
        <SectionHeader eyebrow="Health" title="Progress overview" />
        <GlassCard className="p-4">
          <div className="space-y-5">
            <MetricRow label="Conversion rate" value={conversionRate} />
            <MetricRow label="Task completion" value={taskCompletionRate} />
            <MetricRow
              label="Paid deal share"
              value={deals.length > 0 ? Math.round((paidDeals.length / deals.length) * 100) : 0}
            />
          </div>
        </GlassCard>
      </section>
    </section>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-white">{label}</span>
        <span className="font-semibold text-accent-cyan">{value}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
