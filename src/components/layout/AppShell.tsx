"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { UniversalSearchModal } from "@/components/layout/UniversalSearchModal";
import { AnalyticsScreen } from "@/components/screens/AnalyticsScreen";
import { ClientsScreen } from "@/components/screens/ClientsScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { DealsScreen } from "@/components/screens/DealsScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { TasksScreen } from "@/components/screens/TasksScreen";
import { getOrCreateProfile } from "@/lib/services/profiles";
import { labels } from "@/lib/labels";
import { createActivity, getActivities } from "@/lib/services/activities";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
  type ClientUpsertInput
} from "@/lib/services/clients";
import {
  createDeal,
  deleteDeal,
  getDeals,
  updateDeal,
  type DealUpsertInput
} from "@/lib/services/deals";
import { createTask, deleteTask, getTasks, updateTask, type TaskUpsertInput } from "@/lib/services/tasks";
import { getTelegramIdentity, type NormalizedTelegramUser } from "@/lib/telegram";
import type { Activity, Client, Deal, NavTab, Profile, Task } from "@/types";

const screenMap: Record<NavTab, string> = {
  dashboard: labels.nav.dashboard,
  clients: labels.nav.clients,
  tasks: labels.nav.tasks,
  deals: labels.nav.deals,
  analytics: labels.nav.analytics,
  profile: labels.nav.profile
};

export function AppShell() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [telegramUser, setTelegramUser] = useState<NormalizedTelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [addClientRequest, setAddClientRequest] = useState(0);
  const [openClientRequest, setOpenClientRequest] = useState<{
    clientId: string;
    requestId: number;
  } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const title = useMemo(() => screenMap[activeTab], [activeTab]);
  const canRenderContent = !isLoading && !loadError;

  useEffect(() => {
    let alive = true;

    async function loadData() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const nextTelegramUser = getTelegramIdentity();
        const nextProfile = await getOrCreateProfile(nextTelegramUser);
        const [nextClients, nextTasks, nextDeals, nextActivities] = await Promise.all([
          getClients(nextProfile.id),
          getTasks(nextProfile.id),
          getDeals(nextProfile.id),
          getActivities(nextProfile.id)
        ]);

        if (!alive) {
          return;
        }

        setTelegramUser(nextTelegramUser);
        setCurrentProfile(nextProfile);
        setClients(nextClients);
        setTasks(nextTasks);
        setDeals(nextDeals);
        setActivities(nextActivities);
      } catch (error) {
        if (!alive) {
          return;
        }

        console.error("Dashboard load error", error);
        setLoadError(error instanceof Error ? error.message : "Не удалось загрузить данные Supabase");
      } finally {
        if (alive) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  function openAddClientFlow() {
    setActiveTab("clients");
    setAddClientRequest((request) => request + 1);
  }

  function openClientWorkspaceFromSearch(clientId: string) {
    setActiveTab("clients");
    setOpenClientRequest((request) => ({
      clientId,
      requestId: (request?.requestId ?? 0) + 1
    }));
  }

  function handleRetryLoad() {
    setReloadKey((value) => value + 1);
  }

  function getExistingClientId(clientId: string) {
    return clients.some((client) => client.id === clientId) ? clientId : null;
  }

  function getCurrentProfileId() {
    if (!currentProfile?.id) {
      throw new Error("Current profile is not loaded");
    }

    return currentProfile.id;
  }

  async function handleCreateClient(input: ClientUpsertInput) {
    try {
      const profileId = getCurrentProfileId();
      const created = await createClient(profileId, input);
      setClients((current) => [created, ...current]);
      const activity = await createActivity(profileId, {
        clientId: created.id,
        description: `Создан клиент ${created.name}`,
        type: "client"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось создать клиента");
      throw error;
    }
  }

  async function handleUpdateClient(id: string, input: ClientUpsertInput) {
    try {
      const profileId = getCurrentProfileId();
      const updated = await updateClient(profileId, id, input);
      setClients((current) => current.map((client) => (client.id === id ? updated : client)));
      const activity = await createActivity(profileId, {
        clientId: updated.id,
        description: `Обновлен клиент ${updated.name}`,
        type: "client"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось обновить клиента");
      throw error;
    }
  }

  async function handleDeleteClient(id: string) {
    try {
      const profileId = getCurrentProfileId();
      const existingClient = clients.find((client) => client.id === id);
      await deleteClient(profileId, id);
      setClients((current) => current.filter((client) => client.id !== id));
      setTasks((current) =>
        current.map((task) => (task.clientId === id ? { ...task, clientId: "" } : task))
      );
      setDeals((current) =>
        current.map((deal) => (deal.clientId === id ? { ...deal, clientId: "" } : deal))
      );
      if (existingClient) {
        const activity = await createActivity(profileId, {
          clientId: null,
          description: `Удален клиент ${existingClient.name}`,
          type: "client"
        });
        setActivities((current) => [activity, ...current]);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось удалить клиента");
      throw error;
    }
  }

  async function handleCreateTask(input: TaskUpsertInput) {
    try {
      const profileId = getCurrentProfileId();
      const created = await createTask(profileId, input);
      setTasks((current) => [created, ...current]);
      const activity = await createActivity(profileId, {
        clientId: created.clientId,
        description: `Создана задача ${created.title}`,
        type: "task"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось создать задачу");
      throw error;
    }
  }

  async function handleUpdateTask(id: string, input: TaskUpsertInput) {
    try {
      const profileId = getCurrentProfileId();
      const updated = await updateTask(profileId, id, input);
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
      const activity = await createActivity(profileId, {
        clientId: updated.clientId,
        description: `Обновлена задача ${updated.title}`,
        type: "task"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось обновить задачу");
      throw error;
    }
  }

  async function handleDeleteTask(id: string) {
    try {
      const profileId = getCurrentProfileId();
      const existingTask = tasks.find((task) => task.id === id);
      await deleteTask(profileId, id);
      setTasks((current) => current.filter((task) => task.id !== id));
      if (existingTask) {
        const activity = await createActivity(profileId, {
          clientId: getExistingClientId(existingTask.clientId),
          description: `Удалена задача ${existingTask.title}`,
          type: "task"
        });
        setActivities((current) => [activity, ...current]);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось удалить задачу");
      throw error;
    }
  }

  async function handleCreateDeal(input: DealUpsertInput) {
    try {
      const profileId = getCurrentProfileId();
      const created = await createDeal(profileId, input);
      setDeals((current) => [created, ...current]);
      const activity = await createActivity(profileId, {
        clientId: created.clientId,
        description: `Создана сделка ${created.title}`,
        type: "deal"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось создать сделку");
      throw error;
    }
  }

  async function handleUpdateDeal(id: string, input: DealUpsertInput) {
    try {
      const profileId = getCurrentProfileId();
      const updated = await updateDeal(profileId, id, input);
      setDeals((current) => current.map((deal) => (deal.id === id ? updated : deal)));
      const activity = await createActivity(profileId, {
        clientId: updated.clientId,
        description: `Обновлена сделка ${updated.title}`,
        type: "deal"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось обновить сделку");
      throw error;
    }
  }

  async function handleDeleteDeal(id: string) {
    try {
      const profileId = getCurrentProfileId();
      const existingDeal = deals.find((deal) => deal.id === id);
      await deleteDeal(profileId, id);
      setDeals((current) => current.filter((deal) => deal.id !== id));
      if (existingDeal) {
        const activity = await createActivity(profileId, {
          clientId: getExistingClientId(existingDeal.clientId),
          description: `Удалена сделка ${existingDeal.title}`,
          type: "deal"
        });
        setActivities((current) => [activity, ...current]);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось удалить сделку");
      throw error;
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-28 pt-4">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_20%,transparent_72%,rgba(34,211,238,0.035))]" />
      <div className="pointer-events-none fixed left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-accent-blue/[0.18] blur-3xl" />
      <div className="pointer-events-none fixed bottom-24 left-[-8rem] h-64 w-64 rounded-full bg-accent-cyan/[0.12] blur-3xl" />
      <div className="pointer-events-none fixed right-[-9rem] top-1/3 h-64 w-64 rounded-full bg-accent-purple/[0.10] blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col">
        <header className="mb-5 flex items-center justify-between gap-3 pt-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-cyan/75">
              ClientFlow
            </p>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-white">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="tap-highlight min-h-11 rounded-2xl border border-white/15 bg-white/[0.09] px-3 text-sm font-semibold text-white shadow-glow backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.14] active:translate-y-0"
              onClick={() => setIsSearchOpen(true)}
              type="button"
            >
              {labels.common.search}
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.09] text-sm font-bold shadow-glow backdrop-blur-xl">
              CF
            </div>
          </div>
        </header>

        {isLoading ? <GlassLoadingState title={title} /> : null}
        {loadError ? <GlassErrorState errorMessage={loadError} onRetry={handleRetryLoad} title={title} /> : null}
        {canRenderContent && activeTab === "dashboard" ? (
          <DashboardScreen
            activities={activities}
            clients={clients}
            deals={deals}
            onAddClient={openAddClientFlow}
            onOpenTab={setActiveTab}
            tasks={tasks}
          />
        ) : null}
        {canRenderContent && activeTab === "clients" && currentProfile ? (
          <ClientsScreen
            addClientRequest={addClientRequest}
            currentProfileId={currentProfile.id}
            onCreateDeal={handleCreateDeal}
            onCreateClient={handleCreateClient}
            onCreateTask={handleCreateTask}
            onDeleteClient={handleDeleteClient}
            openClientRequest={openClientRequest}
            onUpdateClient={handleUpdateClient}
            clients={clients}
          />
        ) : null}
        {canRenderContent && activeTab === "tasks" ? (
          <TasksScreen
            clients={clients}
            onCreateTask={handleCreateTask}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
            tasks={tasks}
          />
        ) : null}
        {canRenderContent && activeTab === "deals" ? (
          <DealsScreen
            clients={clients}
            deals={deals}
            onCreateDeal={handleCreateDeal}
            onDeleteDeal={handleDeleteDeal}
            onUpdateDeal={handleUpdateDeal}
          />
        ) : null}
        {canRenderContent && activeTab === "analytics" ? (
          <AnalyticsScreen activities={activities} clients={clients} deals={deals} tasks={tasks} />
        ) : null}
        {canRenderContent && activeTab === "profile" ? (
          <ProfileScreen
            activities={activities}
            clients={clients}
            currentProfile={currentProfile}
            deals={deals}
            tasks={tasks}
            telegramUser={telegramUser}
          />
        ) : null}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <UniversalSearchModal
        activities={activities}
        clients={clients}
        deals={deals}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenClient={openClientWorkspaceFromSearch}
        onOpenTab={setActiveTab}
        tasks={tasks}
      />
    </main>
  );
}

function GlassLoadingState({ title }: { title: string }) {
  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-[26px] p-5 shadow-glass">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-24 rounded-full bg-white/15" />
          <div className="h-7 w-44 rounded-full bg-white/15" />
          <div className="h-16 rounded-[24px] bg-white/10" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-12 rounded-2xl bg-white/10" />
            <div className="h-12 rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
      <p className="px-1 text-xs uppercase tracking-[0.18em] text-app-muted">
        {labels.common.loading}: {title}
      </p>
    </section>
  );
}

function GlassErrorState({
  errorMessage,
  onRetry,
  title
}: {
  errorMessage: string;
  onRetry: () => void;
  title: string;
}) {
  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-[26px] border-accent-red/30 bg-accent-red/[0.12] p-5 shadow-glass">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-100/90">
          Ошибка загрузки
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">{title}: не удалось загрузить</h2>
        <p className="mt-2 text-sm leading-6 text-rose-100/85">{errorMessage}</p>
        <div className="mt-5">
          <button
            className="tap-highlight inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
            onClick={onRetry}
            type="button"
          >
            {labels.common.retry}
          </button>
        </div>
      </div>
    </section>
  );
}
