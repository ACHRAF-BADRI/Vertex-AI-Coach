import type { Activity } from "./activities";
import { apiClient } from "./client";
import type { GymPlan, GymProfile, SavedGymPlan } from "./gym";
import type { StatsSummary } from "./stats";
import type { StepSession } from "./steps";
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
  gym_saved_plan_limit?: number | null;
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
  userStepSessions: (id: string) => apiClient.get<StepSession[]>(`/admin/users/${id}/steps`).then((r) => r.data),
  userGymProfile: (id: string) =>
    apiClient.get<GymProfile | null>(`/admin/users/${id}/gym/profile`).then((r) => r.data),
  userGymPlan: (id: string) => apiClient.get<GymPlan | null>(`/admin/users/${id}/gym/plan`).then((r) => r.data),
  userGymSavedPlans: (id: string) =>
    apiClient.get<SavedGymPlan[]>(`/admin/users/${id}/gym/saved`).then((r) => r.data),
  stats: () => apiClient.get<AdminStats>("/admin/stats").then((r) => r.data),
};
