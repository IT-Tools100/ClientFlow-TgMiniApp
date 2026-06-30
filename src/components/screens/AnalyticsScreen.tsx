import type { Activity, ActivityType, Client, Deal, DealStatus, Task } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { formatActivityType, formatDealStatus } from "@/lib/labels";

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
            <p className="text-sm font-medium text-app-muted">Бизнес-аналитика</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white">
              {moneyFormatter.format(pipelineValue)}
            </p>
            <p className="mt-1 text-sm text-slate-300">Активная воронка</p>
          </div>
          <Badge tone="cyan">Живая статистика</Badge>
        </div>
        {hasAnyAnalytics ? (
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MiniMetric label="Клиенты" value={clients.length} />
            <MiniMetric label="Сделки" value={deals.length} />
            <MiniMetric label="Задачи" value={tasks.length} />
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-app-muted">
            Добавьте клиентов, сделки, задачи или действия, чтобы сформировать аналитику.
          </p>
        )}
      </GlassCard>

      <section>
        <SectionHeader eyebrow="Бизнес" title="Обзор бизнеса" />
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            detail="Все клиенты"
            label="Клиенты"
            tone="blue"
            value={String(clients.length)}
          />
          <StatCard
            detail="Все сделки"
            label="Сделки"
            tone="purple"
            value={String(deals.length)}
          />
          <StatCard
            detail="Новые, переговоры, ожидание оплаты"
            label="Активные сделки"
            tone="purple"
            value={String(activeDeals.length)}
          />
          <StatCard
            detail="Сумма активных сделок"
            label="Воронка"
            tone="green"
            value={moneyFormatter.format(pipelineValue)}
          />
          <StatCard
            detail="Только оплаченные сделки"
            label="Оплачено"
            tone="green"
            value={moneyFormatter.format(paidRevenue)}
          />
          <StatCard
            detail="Все задачи"
            label="Задачи"
            tone="cyan"
            value={String(tasks.length)}
          />
          <StatCard
            detail="Статус выполнена"
            label="Выполненные"
            tone="green"
            value={String(doneTasks.length)}
          />
          <StatCard
            detail="Не выполнены"
            label="Активные задачи"
            tone="cyan"
            value={String(activeTasks.length)}
          />
        </div>
      </section>

      {!hasAnyAnalytics ? (
        <EmptyState
          description="Аналитика появится после создания клиентов, сделок, задач или действий."
          title="Данных для аналитики пока нет"
        />
      ) : null}

      <section>
        <SectionHeader action={`${deals.length} всего`} eyebrow="Сделки" title="Аналитика сделок" />
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
                    label={formatDealStatus(status)}
                    percent={stageShare}
                    tone={getStatusTone(status)}
                  />
                );
              })}
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Создайте сделки, чтобы увидеть количество, сумму и долю по этапам."
            title="Сделок пока нет"
          />
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Выручка" title="Аналитика выручки" />
        {deals.length > 0 ? (
          <GlassCard className="p-4">
            <div className="space-y-3">
              <ValueRow label="Воронка" value={moneyFormatter.format(pipelineValue)} />
              <ValueRow label="Оплачено" value={moneyFormatter.format(paidRevenue)} />
              <ValueRow label="Потеряно" value={moneyFormatter.format(lostRevenue)} />
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Аналитика выручки появится после создания сделок."
            title="Нет данных по выручке"
          />
        )}
      </section>

      <section>
        <SectionHeader action={`${tasks.length} всего`} eyebrow="Задачи" title="Аналитика задач" />
        {tasks.length > 0 ? (
          <GlassCard className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <MiniMetric label="Всего" value={tasks.length} />
              <MiniMetric label="Активные" value={activeTasks.length} />
              <MiniMetric label="Выполнены" value={doneTasks.length} />
              <MiniMetric label="Просрочены" tone="red" value={overdueTasks.length} />
              <MiniMetric label="Сегодня" tone="cyan" value={todayTasks.length} />
              <MiniMetric label="Предстоящие" value={upcomingTasks.length} />
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Создайте задачи, чтобы увидеть выполнение, просрочку, сегодня и предстоящие."
            title="Задач пока нет"
          />
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Клиенты" title="Аналитика клиентов" />
        {clients.length > 0 ? (
          <GlassCard className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <MiniMetric label="Всего клиентов" value={clients.length} />
              <MiniMetric label="Со сделками" value={clientsWithDeals.length} />
              <MiniMetric label="Без сделок" value={clients.length - clientsWithDeals.length} />
              <MiniMetric label="С задачами" value={clientsWithTasks.length} />
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Добавьте клиентов, чтобы анализировать покрытие сделками и задачами."
            title="Клиентов пока нет"
          />
        )}
      </section>

      <section>
        <SectionHeader action={`${activities.length} всего`} eyebrow="Активность" title="Аналитика активности" />
        {activities.length > 0 ? (
          <GlassCard className="p-4">
            <div className="space-y-3">
              {ACTIVITY_TYPES.map((type) => {
                const count = activities.filter((activity) => activity.type === type).length;

                return <ValueRow key={type} label={`${formatActivityType(type)}: действия`} value={String(count)} />;
              })}
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Аналитика активности появится после действий с клиентами, задачами или сделками."
            title="Действий пока нет"
          />
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Выполнение" title="Показатели выполнения" />
        {tasks.length > 0 || closedDealsCount > 0 ? (
          <GlassCard className="p-4">
            <div className="space-y-5">
              <MetricRow
                emptyLabel="Задач пока нет"
                label="Выполнение задач"
                value={tasks.length > 0 ? taskCompletionRate : null}
              />
              <MetricRow
                emptyLabel="Закрытых сделок нет"
                label="Выигранные сделки"
                value={closedDealsCount > 0 ? dealWinRate : null}
              />
              <MetricRow
                emptyLabel="Закрытых сделок нет"
                label="Потерянные сделки"
                value={closedDealsCount > 0 ? dealLostRate : null}
              />
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            description="Завершите задачи или закройте сделки как оплаченные/потерянные для расчета."
            title="Недостаточно данных"
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
            {count} сделок · {percent}% от всех
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
