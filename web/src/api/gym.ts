import { apiClient } from "./client";

export interface GymProfile {
  goal: string;
  level: string;
  equipment: string;
  dietary_notes: string | null;
  updated_at: string | null;
}

export interface GymProfileInput {
  goal: string;
  level: string;
  equipment: string;
  dietary_notes?: string;
}

export interface GymExercise {
  name: string;
  sets: number;
  reps: string;
  rest_sec: number;
  equipment?: string;
  notes?: string;
}

export interface GymWorkoutDay {
  day: string;
  focus: string;
  exercises: GymExercise[];
}

export interface GymNutrition {
  daily_calories: number;
  macros: { protein_g: number; carbs_g: number; fat_g: number };
  meal_suggestions: string[];
}

export interface GymSupplement {
  name: string;
  reason: string;
  timing: string;
}

export interface GymMilestone {
  week: number;
  description: string;
}

export interface GymExpectedResults {
  weeks_to_see_results: number;
  milestones: GymMilestone[];
}

export interface GymPlan {
  id: string;
  goal: string | null;
  workout_split: GymWorkoutDay[];
  nutrition: GymNutrition;
  supplements: GymSupplement[];
  expected_results: GymExpectedResults | null;
  generated_at: string;
  status: string;
}

export const gymApi = {
  getProfile: () => apiClient.get<GymProfile | null>("/gym/profile").then((r) => r.data),
  updateProfile: (input: GymProfileInput) => apiClient.put<GymProfile>("/gym/profile", input).then((r) => r.data),
  currentPlan: () => apiClient.get<GymPlan | null>("/gym/plan/current").then((r) => r.data),
  generatePlan: () => apiClient.post<GymPlan>("/gym/plan/generate").then((r) => r.data),
  deletePlan: () => apiClient.delete("/gym/plan/current"),
  translatePlan: (lang: "fr" | "en") =>
    apiClient.post<GymPlan | null>("/gym/plan/translate", { lang }).then((r) => r.data),
};
