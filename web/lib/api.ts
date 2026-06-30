import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  }).catch(() => {
    throw new ApiError("Unable to reach the server. Is the API running?", 0);
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? res.statusText);
    throw new ApiError(message, res.status);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data;
}

export interface UserSettings {
  id: string;
  userId: string;
  baseColor: string;
  accentColor: string;
  currency: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  settings: UserSettings | null;
}

export interface HabitLog {
  id: string;
  completedDate: string;
  count: number;
}

export type HabitFrequency = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type HabitScheduleDays =
  | { weekly: number[] }
  | { monthly: number[] }
  | { yearly: Array<{ month: number; day: number }> }
  | { intervalDays: number }
  | null;

export interface Habit {
  id: string;
  name: string;
  color: string;
  icon: string;
  targetCount: number;
  frequency: HabitFrequency;
  scheduleDays: HabitScheduleDays;
  scheduleSummary: string;
  sortOrder: number;
  trackingEnabled: boolean;
  createdAt: string;
  streak: number;
  logs: HabitLog[];
}

export interface TaskHabit {
  id: string;
  name: string;
  color: string;
  icon: string;
  targetCount: number;
  count: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface Task {
  id: string;
  title: string;
  details: string | null;
  date: string;
  completed: boolean;
  sortOrder: number;
  habitId: string | null;
  habit: TaskHabit | null;
  subtasks: Subtask[];
  createdAt: string;
}

export interface TaskCalendarDay {
  date: string;
  total: number;
  completed: number;
  completedHabits: Array<{ id: string; color: string }>;
}

export interface Wallet {
  id: string;
  name: string;
  currency: string;
  color: string;
  icon: string;
  createdAt: string;
  balance: string;
}

export interface Transaction {
  id: string;
  userId: string;
  fromWalletId: string | null;
  toWalletId: string | null;
  amount: string;
  type: "income" | "expense" | "transfer";
  note: string | null;
  date: string;
  createdAt: string;
  fromWallet: { id: string; name: string; currency: string } | null;
  toWallet: { id: string; name: string; currency: string } | null;
}

export type PlannedKind = "scheduled" | "recurring";
export type PlannedFrequency = "weekly" | "monthly" | "yearly";

export interface PlannedTransaction {
  id: string;
  type: "income" | "expense" | "transfer";
  amount: string;
  note: string | null;
  fromWalletId: string | null;
  toWalletId: string | null;
  kind: PlannedKind;
  scheduledDate: string | null;
  frequency: PlannedFrequency | null;
  scheduleDays: Record<string, unknown> | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  createdAt: string;
  fromWallet: { id: string; name: string; currency: string } | null;
  toWallet: { id: string; name: string; currency: string } | null;
}

export interface PlannedQueueItem {
  plannedTransactionId: string;
  kind: PlannedKind;
  type: "income" | "expense" | "transfer";
  amount: string;
  note: string | null;
  fromWalletId: string | null;
  toWalletId: string | null;
  fromWallet: { id: string; name: string; currency: string } | null;
  toWallet: { id: string; name: string; currency: string } | null;
  anchorDate: string;
  scheduledDate: string | null;
  frequency: PlannedFrequency | null;
  scheduleDays: Record<string, unknown> | null;
  startDate: string | null;
  endDate: string | null;
  nextDueDate: string | null;
  scheduleSummary: string;
}

export type ProjectionUnit = "week" | "month" | "year";

export interface NetworkProjectionRange {
  unit: ProjectionUnit;
  count: number;
}

export interface NetworkProjectionPoint {
  date: string;
  label: string;
  totals: Record<string, number>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<User>("/me"),

  getHabits: () => request<Habit[]>("/habits"),

  createHabit: (data: {
    name: string;
    color?: string;
    icon?: string;
    targetCount?: number;
    frequency?: HabitFrequency;
    weeklyDays?: number[];
    monthlyDays?: number[];
    yearlyDays?: Array<{ month: number; day: number }>;
    intervalDays?: number;
    trackingEnabled?: boolean;
  }) =>
    request<Habit>("/habits", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateHabit: (
    habitId: string,
    data: {
      name?: string;
      color?: string;
      icon?: string;
      targetCount?: number;
      frequency?: HabitFrequency;
      weeklyDays?: number[];
      monthlyDays?: number[];
      yearlyDays?: Array<{ month: number; day: number }>;
      intervalDays?: number;
      archive?: boolean;
      trackingEnabled?: boolean;
    },
  ) =>
    request<Habit>(`/habits/${habitId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteHabit: (habitId: string) =>
    request<Habit>(`/habits/${habitId}`, {
      method: "PATCH",
      body: JSON.stringify({ archive: true }),
    }),

  toggleHabit: (habitId: string, date: string) =>
    request<{
      count: number;
      targetCount: number;
      completed: boolean;
      date: string;
    }>(`/habits/${habitId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ date }),
    }),

  reorderHabits: (habitIds: string[]) =>
    request<Habit[]>("/habits/reorder", {
      method: "POST",
      body: JSON.stringify({ habitIds }),
    }),

  getTasks: (date: string) =>
    request<Task[]>(`/tasks?date=${encodeURIComponent(date)}`),

  getTaskCalendar: (month: string) =>
    request<TaskCalendarDay[]>(
      `/tasks/calendar?month=${encodeURIComponent(month)}`,
    ),

  createTask: (data: { title: string; details?: string; date: string }) =>
    request<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTask: (
    taskId: string,
    data: { title?: string; details?: string },
  ) =>
    request<Task>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  toggleTask: (taskId: string) =>
    request<Task>(`/tasks/${taskId}/toggle`, {
      method: "POST",
    }),

  deleteTask: (taskId: string) =>
    request<void>(`/tasks/${taskId}`, {
      method: "DELETE",
    }),

  reorderTasks: (date: string, taskIds: string[]) =>
    request<Task[]>("/tasks/reorder", {
      method: "POST",
      body: JSON.stringify({ date, taskIds }),
    }),

  transferTaskToToday: (taskId: string) =>
    request<Task>(`/tasks/${taskId}/transfer-to-today`, {
      method: "POST",
    }),

  createSubtask: (taskId: string, title: string) =>
    request<Subtask>(`/tasks/${taskId}/subtasks`, {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  toggleSubtask: (taskId: string, subtaskId: string) =>
    request<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
      method: "POST",
    }),

  deleteSubtask: (taskId: string, subtaskId: string) =>
    request<void>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: "DELETE",
    }),

  updateSubtask: (taskId: string, subtaskId: string, title: string) =>
    request<Subtask>(`/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    }),

  getWallets: () => request<Wallet[]>("/wallets"),

  createWallet: (data: {
    name: string;
    currency?: string;
    color?: string;
    icon?: string;
    initialAmount?: number;
  }) =>
    request<Wallet>("/wallets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateWallet: (
    walletId: string,
    data: {
      name?: string;
      currency?: string;
      color?: string;
      icon?: string;
    },
  ) =>
    request<Wallet>(`/wallets/${walletId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteWallet: (walletId: string) =>
    request<void>(`/wallets/${walletId}`, {
      method: "DELETE",
    }),

  getTransactions: () => request<Transaction[]>("/transactions"),

  createTransaction: (data: {
    type: "income" | "expense" | "transfer";
    amount: number;
    date: string;
    note?: string;
    fromWalletId?: string;
    toWalletId?: string;
  }) =>
    request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPlannedTransactions: () =>
    request<PlannedTransaction[]>("/planned-transactions"),

  getPlannedQueue: () => request<PlannedQueueItem[]>("/planned-transactions/queue"),

  getNetworkProjection: ({ unit, count }: NetworkProjectionRange) =>
    request<NetworkProjectionPoint[]>(
      `/planned-transactions/projection?unit=${unit}&count=${count}`,
    ),

  createPlannedTransaction: (data: {
    type: "income" | "expense" | "transfer";
    amount: number;
    note?: string;
    fromWalletId?: string;
    toWalletId?: string;
    kind: PlannedKind;
    scheduledDate?: string;
    frequency?: PlannedFrequency;
    weeklyDays?: number[];
    monthlyDays?: number[];
    yearlyDays?: Array<{ month: number; day: number }>;
    startDate?: string;
    endDate?: string;
  }) =>
    request<PlannedTransaction>("/planned-transactions", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updatePlannedTransaction: (
    id: string,
    data: {
      amount?: number;
      note?: string;
      active?: boolean;
      scheduledDate?: string;
      frequency?: PlannedFrequency;
      weeklyDays?: number[];
      monthlyDays?: number[];
      yearlyDays?: Array<{ month: number; day: number }>;
      startDate?: string;
      endDate?: string;
    },
  ) =>
    request<PlannedTransaction>(`/planned-transactions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deletePlannedTransaction: (id: string) =>
    request<void>(`/planned-transactions/${id}`, {
      method: "DELETE",
    }),

  updateSettings: (data: {
    baseColor?: string;
    accentColor?: string;
    currency?: string;
  }) =>
    request<UserSettings>("/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
