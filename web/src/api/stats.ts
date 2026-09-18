import { apiClient } from "./client";

export interface WeeklyVolume {
  week_start: string;
  distance_km: number;
}

export interface PacePoint {
  date: string;
  pace: number;
}

export interface StatsSummary {
  total_distance_km: number;
  total_activities: number;
  total_calories: number;
  total_steps: number;
  avg_pace: number | null;
  weekly_volume: WeeklyVolume[];
  pace_trend: PacePoint[];
}

export const statsApi = {
  summary: () => apiClient.get<StatsSummary>("/stats/summary").then((r) => r.data),
};
