"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { AnalyticsScreen } from "@/components/screens/AnalyticsScreen";
import { ClientsScreen } from "@/components/screens/ClientsScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { DealsScreen } from "@/components/screens/DealsScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { TasksScreen } from "@/components/screens/TasksScreen";
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
import type { Activity, Client, Deal, NavTab, Task } from "@/types";

const screenMap: Record<NavTab, string> = {
  dashboard: "Dashboard",
  clients: "Clients",
  tasks: "Tasks",
  deals: "Deals",
  analytics: "Analytics",
  profile: "Profile"
};

export function AppShell() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [addClientRequest, setAddClientRequest] = useState(0);
  const title = useMemo(() => screenMap[activeTab], [activeTab]);

  useEffect(() => {
    console.log("loading state", isLoading);
  }, [isLoading]);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      console.log("Dashboard start");
      setIsLoading(true);
      setLoadError(null);

      try {
        const nextClientsPromise = (async () => {
          console.log("Loading clients");
          const data = await getClients();
          console.log("Clients loaded");
          return data;
        })();

        const nextTasksPromise = (async () => {
          console.log("Loading tasks");
          const data = await getTasks();
          console.log("Tasks loaded");
          return data;
        })();

        const nextDealsPromise = (async () => {
          console.log("Loading deals");
          const data = await getDeals();
          console.log("Deals loaded");
          return data;
        })();

        const [nextClients, nextTasks, nextDeals] = await Promise.all([
          nextClientsPromise,
          nextTasksPromise,
          nextDealsPromise
        ]);

        if (!alive) {
          return;
        }

        setClients(nextClients);
        setTasks(nextTasks);
        setDeals(nextDeals);
        console.log("Loading activities");
        void getActivities()
          .then((nextActivities) => {
            console.log("Activities loaded");
            if (alive) {
              setActivities(nextActivities);
            }
          })
          .catch((error) => {
            console.error("Activities load error", error);
          });
      } catch (error) {
        if (!alive) {
          return;
        }

        console.error("Dashboard load error", error);
        setLoadError(error instanceof Error ? error.message : "Failed to load demo data");
      } finally {
        if (alive) {
          console.log("Dashboard ready");
          console.log("setLoading(false)");
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

  function handleRetryLoad() {
    setReloadKey((value) => value + 1);
  }

  async function handleCreateClient(input: ClientUpsertInput) {
    try {
      const created = await createClient(input);
      setClients((current) => [created, ...current]);
      const activity = await createActivity({
        clientId: created.id,
        description: `Created client ${created.name}`,
        type: "client"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to create client");
      throw error;
    }
  }

  async function handleUpdateClient(id: string, input: ClientUpsertInput) {
    try {
      const updated = await updateClient(id, input);
      setClients((current) => current.map((client) => (client.id === id ? updated : client)));
      const activity = await createActivity({
        clientId: updated.id,
        description: `Updated client ${updated.name}`,
        type: "client"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to update client");
      throw error;
    }
  }

  async function handleDeleteClient(id: string) {
    try {
      const existingClient = clients.find((client) => client.id === id);
      await deleteClient(id);
      setClients((current) => current.filter((client) => client.id !== id));
      if (existingClient) {
        const activity = await createActivity({
          clientId: existingClient.id,
          description: `Deleted client ${existingClient.name}`,
          type: "client"
        });
        setActivities((current) => [activity, ...current]);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to delete client");
      throw error;
    }
  }

  async function handleCreateTask(input: TaskUpsertInput) {
    try {
      const created = await createTask(input);
      setTasks((current) => [created, ...current]);
      const activity = await createActivity({
        clientId: created.clientId,
        description: `Created task ${created.title}`,
        type: "task"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to create task");
      throw error;
    }
  }

  async function handleUpdateTask(id: string, input: TaskUpsertInput) {
    try {
      const updated = await updateTask(id, input);
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)));
      const activity = await createActivity({
        clientId: updated.clientId,
        description: `Updated task ${updated.title}`,
        type: "task"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to update task");
      throw error;
    }
  }

  async function handleDeleteTask(id: string) {
    try {
      const existingTask = tasks.find((task) => task.id === id);
      await deleteTask(id);
      setTasks((current) => current.filter((task) => task.id !== id));
      if (existingTask) {
        const activity = await createActivity({
          clientId: existingTask.clientId,
          description: `Deleted task ${existingTask.title}`,
          type: "task"
        });
        setActivities((current) => [activity, ...current]);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to delete task");
      throw error;
    }
  }

  async function handleCreateDeal(input: DealUpsertInput) {
    try {
      const created = await createDeal(input);
      setDeals((current) => [created, ...current]);
      const activity = await createActivity({
        clientId: created.clientId,
        description: `Created deal ${created.title}`,
        type: "deal"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to create deal");
      throw error;
    }
  }

  async function handleUpdateDeal(id: string, input: DealUpsertInput) {
    try {
      const updated = await updateDeal(id, input);
      setDeals((current) => current.map((deal) => (deal.id === id ? updated : deal)));
      const activity = await createActivity({
        clientId: updated.clientId,
        description: `Updated deal ${updated.title}`,
        type: "deal"
      });
      setActivities((current) => [activity, ...current]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to update deal");
      throw error;
    }
  }

  async function handleDeleteDeal(id: string) {
    try {
      const existingDeal = deals.find((deal) => deal.id === id);
      await deleteDeal(id);
      setDeals((current) => current.filter((deal) => deal.id !== id));
      if (existingDeal) {
        const activity = await createActivity({
          clientId: existingDeal.clientId,
          description: `Deleted deal ${existingDeal.title}`,
          type: "deal"
        });
        setActivities((current) => [activity, ...current]);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to delete deal");
      throw error;
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-28 pt-4">
      <div className="pointer-events-none fixed left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-accent-blue/20 blur-3xl" />
      <div className="pointer-events-none fixed bottom-24 left-[-8rem] h-64 w-64 rounded-full bg-accent-cyan/[0.14] blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col">
        <header className="mb-5 flex items-center justify-between pt-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-cyan/75">
              ClientFlow
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{title}</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-bold shadow-glow backdrop-blur-xl">
            CF
          </div>
        </header>

        {isLoading ? (
          <GlassLoadingState title={title} />
        ) : loadError ? (
          <GlassErrorState errorMessage={loadError} onRetry={handleRetryLoad} title={title} />
        ) : activeTab === "dashboard" ? (
          <DashboardScreen
            activities={activities}
            clients={clients}
            deals={deals}
            onAddClient={openAddClientFlow}
            onOpenTab={setActiveTab}
            tasks={tasks}
          />
        ) : null}
        {activeTab === "clients" ? (
          <ClientsScreen
            addClientRequest={addClientRequest}
            onCreateClient={handleCreateClient}
            onDeleteClient={handleDeleteClient}
            onUpdateClient={handleUpdateClient}
            clients={clients}
          />
        ) : null}
        {activeTab === "tasks" ? (
          <TasksScreen
            clients={clients}
            onCreateTask={handleCreateTask}
            onDeleteTask={handleDeleteTask}
            onUpdateTask={handleUpdateTask}
            tasks={tasks}
          />
        ) : null}
        {activeTab === "deals" ? (
          <DealsScreen
            clients={clients}
            deals={deals}
            onCreateDeal={handleCreateDeal}
            onDeleteDeal={handleDeleteDeal}
            onUpdateDeal={handleUpdateDeal}
          />
        ) : null}
        {activeTab === "analytics" ? (
          <AnalyticsScreen clients={clients} deals={deals} tasks={tasks} />
        ) : null}
        {activeTab === "profile" ? <ProfileScreen /> : null}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}

function GlassLoadingState({ title }: { title: string }) {
  return (
    <section className="space-y-5">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.08] p-5 shadow-glass">
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
      <p className="px-1 text-xs uppercase tracking-[0.18em] text-app-muted">Loading {title}</p>
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
      <div className="rounded-[28px] border border-accent-red/30 bg-accent-red/[0.12] p-5 shadow-glass">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-100/90">
          Load error
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">{title} could not load</h2>
        <p className="mt-2 text-sm leading-6 text-rose-100/85">{errorMessage}</p>
        <div className="mt-5">
          <button
            className="tap-highlight inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
            onClick={onRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      </div>
    </section>
  );
}
