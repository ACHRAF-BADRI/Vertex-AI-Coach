import { apiClient } from "./client";

export interface StepSession {
  id: string;
  started_at: string;
  distance_km: number;
  duration_sec: number;
  steps: number;
  calories: number;
  avg_speed_kmh: number;
  path: [number, number][];
}

export interface StepSessionInput {
  started_at: string;
  distance_km: number;
  duration_sec: number;
  path: [number, number][];
}

export const stepsApi = {
  list: () => apiClient.get<StepSession[]>("/steps/sessions").then((r) => r.data),
  create: (input: StepSessionInput) => apiClient.post<StepSession>("/steps/sessions", input).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/steps/sessions/${id}`),
};
