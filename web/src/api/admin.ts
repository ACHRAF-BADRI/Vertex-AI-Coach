import type { Activity } from "./activities";
import { apiClient } from "./client";
import type { StatsSummary } from "./stats";
import type { User } from "../context/AuthContext";

export interface UsersPage {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  goal?: string;
  status?: "active" | "suspended";
}

export interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  admin_count: number;
  signups_by_week: { week_start: string; count: number }[];
}

export const adminApi = {
  listUsers: (params: ListUsersParams) => apiClient.get<UsersPage>("/admin/users", { params }).then((r) => r.data),
  createUser: (input: UserInput) => apiClient.post<User>("/admin/users", input).then((r) => r.data),
  updateUser: (id: string, input: Partial<UserInput>) =>
    apiClient.patch<User>(`/admin/users/${id}`, input).then((r) => r.data),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
  userActivities: (id: string) => apiClient.get<Activity[]>(`/admin/users/${id}/activities`).then((r) => r.data),
  userStats: (id: string) => apiClient.get<StatsSummary>(`/admin/users/${id}/stats`).then((r) => r.data),
  stats: () => apiClient.get<AdminStats>("/admin/stats").then((r) => r.data),
};
