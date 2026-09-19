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
  name_en?: string;
  sets: number;
  reps: string;
  rest_sec: number;
  equipment?: string;
  notes?: string;
  image_url?: string | null;
  image_full_url?: string | null;
  video_url?: string | null;
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
  brands?: string[];
}

export interface SendPlanResult {
  status: "sent" | "replaced" | "saved";
}

export interface LimitConflict {
  error: string;
  code: "limit_reached";
  saved_plans: { id: string; name: string }[];
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

export interface SavedGymPlan {
  id: string;
  name: string;
  goal: string | null;
  workout_split: GymWorkoutDay[];
  nutrition: GymNutrition;
  supplements: GymSupplement[];
  expected_results: GymExpectedResults | null;
  saved_at: string;
}

export interface SharedGymPlan {
  id: string;
  sender_name: string;
  name: string;
  goal: string | null;
  workout_split: GymWorkoutDay[];
  nutrition: GymNutrition;
  supplements: GymSupplement[];
  expected_results: GymExpectedResults | null;
  created_at: string;
}

export const gymApi = {
  getProfile: () => apiClient.get<GymProfile | null>("/gym/profile").then((r) => r.data),
  updateProfile: (input: GymProfileInput) => apiClient.put<GymProfile>("/gym/profile", input).then((r) => r.data),
  currentPlan: () => apiClient.get<GymPlan | null>("/gym/plan/current").then((r) => r.data),
  generatePlan: () => apiClient.post<GymPlan>("/gym/plan/generate").then((r) => r.data),
  deletePlan: () => apiClient.delete("/gym/plan/current"),
  translatePlan: (lang: "fr" | "en") =>
    apiClient.post<GymPlan | null>("/gym/plan/translate", { lang }).then((r) => r.data),
  replaceExercise: (dayIndex: number, exerciseIndex: number, exercise: GymExercise) =>
    apiClient
      .put<GymPlan>("/gym/plan/exercise", { day_index: dayIndex, exercise_index: exerciseIndex, exercise })
      .then((r) => r.data),
  exerciseAlternatives: (name: string, name_en: string | undefined, equipment: string | undefined) =>
    apiClient
      .post<{ alternatives: GymExercise[] }>("/gym/exercise/alternatives", { name, name_en, equipment })
      .then((r) => r.data.alternatives),
  savePlan: (name: string) => apiClient.post<SavedGymPlan>("/gym/plan/save", { name }).then((r) => r.data),
  listSavedPlans: () => apiClient.get<SavedGymPlan[]>("/gym/plan/saved").then((r) => r.data),
  deleteSavedPlan: (id: string) => apiClient.delete(`/gym/plan/saved/${id}`),
  activateSavedPlan: (id: string) => apiClient.post<GymPlan>(`/gym/plan/saved/${id}/activate`).then((r) => r.data),
  replaceSupplement: (supplementIndex: number, supplement: GymSupplement) =>
    apiClient
      .put<GymPlan>("/gym/plan/supplement", { supplement_index: supplementIndex, supplement })
      .then((r) => r.data),
  supplementAlternatives: (name: string, reason: string | undefined) =>
    apiClient
      .post<{ alternatives: GymSupplement[] }>("/gym/supplement/alternatives", { name, reason })
      .then((r) => r.data.alternatives),
  sendPlan: (email: string, name: string, planId?: string) =>
    apiClient.post<SendPlanResult>("/gym/plan/send", { email, name, plan_id: planId }).then((r) => r.data),
  listInbox: () => apiClient.get<SharedGymPlan[]>("/gym/inbox").then((r) => r.data),
  acceptShare: (id: string, replaceId?: string) =>
    apiClient.post<SendPlanResult>(`/gym/inbox/${id}/accept`, { replace_id: replaceId }).then((r) => r.data),
  inboxCount: () => apiClient.get<{ count: number }>("/gym/inbox/count").then((r) => r.data.count),
  declineShare: (id: string) => apiClient.delete(`/gym/inbox/${id}`),
};
