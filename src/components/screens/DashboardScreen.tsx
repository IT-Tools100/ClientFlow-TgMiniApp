import type { Activity, Client, Deal, DealStatus, NavTab, Task } from "@/types";
import { Badge, getStatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassCard } from "@/components/ui/GlassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatCard } from "@/components/ui/StatCard";
import { formatDealStatus, formatPriority, formatTaskDue, labels } from "@/lib/labels";

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
        <p className="text-sm font-medium text-app-muted">Рабочий центр CRM</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tracking-tight text-white">
              {moneyFormatter.format(activePipelineAmount)}
            </p>
            <p className="mt-1 text-sm text-slate-300">Сумма активной воронки</p>
          </div>
          <Badge tone={overdueTasks.length > 0 ? "red" : "cyan"}>
            {todayTasks.length} сегодня · {overdueTasks.length} просрочено
          </Badge>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button onClick={onAddClient}>Добавить клиента</Button>
          <Button onClick={() => onOpenTab("tasks")} variant="secondary">
            Открыть задачи
          </Button>
          <Button onClick={() => onOpenTab("deals")} variant="secondary">
            Открыть сделки
          </Button>
          <Button onClick={() => onOpenTab("deals")} variant="ghost">
            Открыть воронку
          </Button>
        </div>
        {overdueTasks.length > 0 ? (
          <Button className="mt-3 w-full" onClick={() => onOpenTab("tasks")} variant="ghost">
            Открыть просроченные задачи
          </Button>
        ) : null}
      </GlassCard>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          detail="Все клиенты"
          label="Клиенты"
          tone="blue"
          value={String(clients.length)}
        />
        <StatCard
          detail="Новые, переговоры, ожидание оплаты"
          label="Активные сделки"
          tone="purple"
          value={String(activeDeals.length)}
        />
        <StatCard
          detail="Без оплаченных и потерянных"
          label="Активная воронка"
          tone="green"
          value={moneyFormatter.format(activePipelineAmount)}
        />
        <StatCard
          detail="Только оплаченные сделки"
          label="Оплачено"
          tone="green"
          value={moneyFormatter.format(paidRevenue)}
        />
        <StatCard
          detail="Не выполнены"
          label="Активные задачи"
          tone="cyan"
          value={String(activeTasks.length)}
        />
        <StatCard
          detail="Активные и просроченные"
          label="Просрочено"
          tone="purple"
          value={String(overdueTasks.length)}
        />
        <StatCard
          detail="Активные на сегодня"
          label="Сегодня"
          tone="cyan"
          value={String(todayTasks.length)}
        />
      </div>

      {clients.length === 0 ? (
        <EmptyState
          actionLabel="Добавить клиента"
          description="Создайте первого клиента, чтобы связать задачи, сделки и действия."
          onAction={onAddClient}
          title="Клиентов пока нет"
        />
      ) : null}

      <section>
        <SectionHeader action="Срочная работа" eyebrow="Фокус" title="Фокус на сегодня" />
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
                        {clientNameById.get(task.clientId) ?? labels.common.unknownClient}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Срок {normalizeDateKey(task.dueDate) || labels.common.notSet} ·{" "}
                        {formatPriority(task.priority)}
                      </p>
                    </div>
                    <Badge tone={getStatusTone(dueState)}>{formatTaskDue(dueState)}</Badge>
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
                      {clientNameById.get(deal.clientId) ?? labels.common.unknownClient}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Вероятность {deal.probability}%
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={getStatusTone(deal.status)}>{formatDealStatus(deal.status)}</Badge>
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
            description="Нет просроченных задач, задач на сегодня или сделок в ожидании оплаты."
            title="Срочных действий нет"
          />
        )}
      </section>

      <section>
        <SectionHeader action={`${tasks.length} всего`} eyebrow="Задачи" title="Сводка задач" />
        {tasks.length > 0 ? (
          <GlassCard className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <SnapshotMetric label="Активные" value={activeTasks.length} />
              <SnapshotMetric label="Выполнены" value={doneTasks.length} />
              <SnapshotMetric label="Просрочены" tone="red" value={overdueTasks.length} />
              <SnapshotMetric label="Сегодня" tone="cyan" value={todayTasks.length} />
              <SnapshotMetric label="Предстоящие" value={upcomingTasks.length} />
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            actionLabel="Открыть задачи"
            description="Создайте задачи, чтобы отслеживать работу на сегодня, просрочку и будущие дела."
            onAction={() => onOpenTab("tasks")}
            title="Задач пока нет"
          />
        )}
      </section>

      <section>
        <SectionHeader action={`${deals.length} всего`} eyebrow="Сделки" title="Сводка воронки" />
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
                        <Badge tone={getStatusTone(status)}>{formatDealStatus(status)}</Badge>
                        <span className="text-xs text-app-muted">{stageDeals.length}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{stageDeals.length} сделок</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-white">
                      {moneyFormatter.format(stageAmount)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.08] px-3 py-2">
              <span className="text-xs text-app-muted">Потеряно</span>
              <span className="text-sm font-semibold text-white">
                {moneyFormatter.format(sumDeals(lostDeals))}
              </span>
            </div>
          </GlassCard>
        ) : (
          <EmptyState
            actionLabel="Открыть сделки"
            description="Создайте сделки, чтобы увидеть воронку по этапам."
            onAction={() => onOpenTab("deals")}
            title="Сделок пока нет"
          />
        )}
      </section>

      <section>
        <SectionHeader eyebrow="Активность" title="Последние действия" />
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
            description="Создавайте или обновляйте клиентов, задачи и сделки, чтобы видеть действия здесь."
            title="Действий пока нет"
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
