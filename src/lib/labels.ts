import type { ActivityType, ClientStatus, DealStatus, NavTab, TaskPriority, TaskStatus } from "@/types";

export const labels = {
  app: {
    name: "ClientFlow"
  },
  nav: {
    dashboard: "Обзор",
    clients: "Клиенты",
    tasks: "Задачи",
    deals: "Сделки",
    analytics: "Аналитика",
    profile: "Профиль"
  } satisfies Record<NavTab, string>,
  common: {
    add: "Добавить",
    edit: "Изменить",
    delete: "Удалить",
    save: "Сохранить",
    cancel: "Отмена",
    search: "Поиск",
    create: "Создать",
    update: "Обновить",
    close: "Закрыть",
    open: "Открыть",
    loading: "Загрузка",
    error: "Ошибка",
    empty: "Нет данных",
    retry: "Повторить",
    saving: "Сохранение...",
    unknownClient: "Клиент не найден",
    notSet: "не указан",
    notAvailable: "Недоступно",
    total: "всего"
  },
  clientStatus: {
    New: "Новый",
    Contacted: "Связались",
    "In Progress": "В работе",
    "Waiting Payment": "Ожидает оплату",
    Paid: "Оплачен",
    Lost: "Потерян"
  } satisfies Record<ClientStatus, string>,
  dealStatus: {
    New: "Новая",
    Negotiation: "Переговоры",
    "Waiting Payment": "Ожидает оплату",
    Paid: "Оплачена",
    Lost: "Потеряна"
  } satisfies Record<DealStatus, string>,
  taskStatus: {
    Today: "Сегодня",
    Upcoming: "Предстоящая",
    Done: "Выполнена",
    Overdue: "Просрочена"
  } satisfies Record<TaskStatus, string>,
  taskCompletion: {
    Active: "Активная",
    Done: "Выполнена"
  },
  taskDue: {
    Overdue: "Просрочена",
    Today: "Сегодня",
    Upcoming: "Предстоящая"
  },
  priority: {
    Low: "Низкий",
    Medium: "Средний",
    High: "Высокий"
  } satisfies Record<TaskPriority, string>,
  activityType: {
    client: "Клиент",
    deal: "Сделка",
    task: "Задача",
    payment: "Оплата"
  } satisfies Record<ActivityType, string>
};

export function formatClientStatus(status: ClientStatus) {
  return labels.clientStatus[status];
}

export function formatDealStatus(status: DealStatus) {
  return labels.dealStatus[status];
}

export function formatTaskStatus(status: TaskStatus) {
  return labels.taskStatus[status];
}

export function formatTaskCompletion(status: "Active" | "Done") {
  return labels.taskCompletion[status];
}

export function formatTaskDue(status: "Overdue" | "Today" | "Upcoming") {
  return labels.taskDue[status];
}

export function formatPriority(priority: TaskPriority) {
  return labels.priority[priority];
}

export function formatActivityType(type: ActivityType) {
  return labels.activityType[type];
}
