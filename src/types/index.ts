export type ClientStatus =
  | "New"
  | "Contacted"
  | "In Progress"
  | "Waiting Payment"
  | "Paid"
  | "Lost";

export type DealStatus =
  | "New"
  | "Negotiation"
  | "Waiting Payment"
  | "Paid"
  | "Lost";

export type TaskStatus = "Today" | "Upcoming" | "Done" | "Overdue";
export type TaskPriority = "Low" | "Medium" | "High";

export type ActivityType = "client" | "deal" | "task" | "payment";

export type NavTab =
  | "dashboard"
  | "clients"
  | "tasks"
  | "deals"
  | "analytics"
  | "profile";

export interface Client {
  id: string;
  name: string;
  contact: string;
  source: string;
  status: ClientStatus;
  value: number;
  notes: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  clientId: string;
  title: string;
  amount: number;
  status: DealStatus;
  probability: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  clientId: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  time: string;
}
