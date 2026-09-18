import { apiClient } from "./client";

export interface Activity {
  id: string;
  date: string;
  distance_km: number;
  duration_min: number;
  pace: number | null;
  calories: number | null;
  steps: number | null;
  feeling: string | null;
  notes: string | null;
}

export interface ActivityInput {
  date: string;
  distance_km: number;
  duration_min: number;
  feeling?: string;
  notes?: string;
}

export const activitiesApi = {
  list: () => apiClient.get<Activity[]>("/activities").then((r) => r.data),
  create: (input: ActivityInput) => apiClient.post<Activity>("/activities", input).then((r) => r.data),
  update: (id: string, input: Partial<ActivityInput>) =>
    apiClient.put<Activity>(`/activities/${id}`, input).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/activities/${id}`),
};
