import { apiClient } from "./client";

export interface PlanSession {
  day: string;
  type: string;
  distance_km: number;
  duration_min: number;
  intensity: string;
  description: string;
}

export interface PlanWeek {
  week_number: number;
  focus: string;
  sessions: PlanSession[];
}

export interface TrainingPlan {
  id: string;
  goal: string | null;
  weeks: PlanWeek[];
  generated_at: string;
  status: string;
}

export const plansApi = {
  current: () => apiClient.get<TrainingPlan | null>("/plans/current").then((r) => r.data),
  generate: () => apiClient.post<TrainingPlan>("/plans/generate").then((r) => r.data),
  remove: () => apiClient.delete("/plans/current"),
  translate: (lang: "fr" | "en") =>
    apiClient.post<TrainingPlan | null>("/plans/current/translate", { lang }).then((r) => r.data),
};
