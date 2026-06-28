import type { Activity, Client, Deal, Task } from "@/types";

export const clients: Client[] = [
  {
    id: "client-1",
    name: "Mila Petrova",
    contact: "@mila_bloom",
    source: "Telegram",
    status: "In Progress",
    value: 180000,
    notes: "Needs a polished mini app launch flow and weekly progress updates.",
    createdAt: "2026-06-18",
    updatedAt: "2026-06-22"
  },
  {
    id: "client-2",
    name: "Artem Sokolov",
    contact: "@artbeats",
    source: "Referral",
    status: "Waiting Payment",
    value: 95000,
    notes: "Waiting for invoice details before paying the landing refresh deposit.",
    createdAt: "2026-06-16",
    updatedAt: "2026-06-21"
  },
  {
    id: "client-3",
    name: "Nika Orlova",
    contact: "@nika_yoga",
    source: "Instagram",
    status: "New",
    value: 45000,
    notes: "Interested in a lead capture funnel for a local yoga studio.",
    createdAt: "2026-06-22",
    updatedAt: "2026-06-22"
  }
];

export const deals: Deal[] = [
  {
    id: "deal-1",
    clientId: "client-1",
    title: "Mini app launch",
    amount: 180000,
    status: "Negotiation",
    probability: 72,
    createdAt: "2026-06-18",
    updatedAt: "2026-06-22"
  },
  {
    id: "deal-2",
    clientId: "client-2",
    title: "Brand landing refresh",
    amount: 95000,
    status: "Waiting Payment",
    probability: 86,
    createdAt: "2026-06-16",
    updatedAt: "2026-06-21"
  },
  {
    id: "deal-3",
    clientId: "client-3",
    title: "Lead capture funnel",
    amount: 45000,
    status: "New",
    probability: 44,
    createdAt: "2026-06-22",
    updatedAt: "2026-06-22"
  }
];

export const tasks: Task[] = [
  {
    id: "task-1",
    clientId: "client-1",
    title: "Send revised proposal",
    description: "Update scope and timeline, then send the revised offer in Telegram.",
    dueDate: "2026-06-23",
    status: "Today",
    priority: "High",
    createdAt: "2026-06-22",
    updatedAt: "2026-06-22"
  },
  {
    id: "task-2",
    clientId: "client-2",
    title: "Confirm payment date",
    description: "Ask when the deposit will be ready and whether invoice details changed.",
    dueDate: "2026-06-23",
    status: "Today",
    priority: "Medium",
    createdAt: "2026-06-21",
    updatedAt: "2026-06-22"
  },
  {
    id: "task-3",
    clientId: "client-3",
    title: "Prepare onboarding notes",
    description: "Collect goals, assets, and funnel examples before the intro call.",
    dueDate: "2026-06-24",
    status: "Upcoming",
    priority: "Low",
    createdAt: "2026-06-22",
    updatedAt: "2026-06-22"
  }
];

export const activities: Activity[] = [
  {
    id: "activity-1",
    clientId: "client-3",
    type: "client",
    title: "New client added",
    description: "Nika Orlova came from Instagram campaign",
    time: "12 min ago",
    createdAt: "2026-06-22"
  },
  {
    id: "activity-2",
    clientId: "client-1",
    type: "deal",
    title: "Deal moved forward",
    description: "Studio Bloom approved the first milestone",
    time: "1h ago",
    createdAt: "2026-06-22"
  },
  {
    id: "activity-3",
    clientId: "client-2",
    type: "payment",
    title: "Payment expected",
    description: "Sokolov Beats is waiting for invoice details",
    time: "3h ago",
    createdAt: "2026-06-22"
  }
];
