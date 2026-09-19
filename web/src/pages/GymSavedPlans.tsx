import { Archive, ChevronDown, Flame, Pill, Send, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { gymApi, type SavedGymPlan } from "../api/gym";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ExerciseThumbnail, ImageLightbox } from "../components/ExerciseMedia";
import { SendPlanModal } from "../components/SendPlanModal";
import { useAuth } from "../context/AuthContext";
import { getMealIcon } from "../utils/mealIcon";

export function GymSavedPlans() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SavedGymPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedGymPlan | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [sendTarget, setSendTarget] = useState<SavedGymPlan | null>(null);
  const [sending, setSending] = useState(false);

  const limit = user?.gym_saved_plan_limit ?? 3;

  useEffect(() => {
    gymApi
      .listSavedPlans()
      .then(setPlans)
      .catch(() => setError(t("gymSavedPlans.loadError")))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await gymApi.deleteSavedPlan(deleteTarget.id);
      setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success(t("gymSavedPlans.deletedToast"));
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleActivate = async (plan: SavedGymPlan) => {
    setActivatingId(plan.id);
    try {
      await gymApi.activateSavedPlan(plan.id);
      toast.success(t("gymSavedPlans.activatedToast"));
      navigate("/gym/plan");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setActivatingId(null);
    }
  };

  const handleSend = async (email: string, name: string) => {
    if (!sendTarget) return;
    setSending(true);
    try {
      await gymApi.sendPlan(email, name, sendTarget.id);
      toast.success(t("gymPlanView.sentToast"));
      setSendTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{t("gymSavedPlans.title")}</h1>
        <Badge variant={plans.length >= limit ? "amber" : "blue"}>
          {t("gymSavedPlans.count", { count: plans.length, limit })}
        </Badge>
      </div>

      {loading && <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && plans.length === 0 && (
        <EmptyState
          icon={<Archive size={28} />}
          title={t("gymSavedPlans.emptyTitle")}
          description={t("gymSavedPlans.emptyDescription")}
        />
      )}

      <div className="flex flex-col gap-3">
        {plans.map((plan) => {
          const isExpanded = expandedId === plan.id;
          return (
            <div
              key={plan.id}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{plan.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {plan.goal ?? t("gymPlanView.goalUndefined")} ·{" "}
                    {t("gymSavedPlans.savedOn", {
                      date: new Date(plan.saved_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR"),
                    })}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={`shrink-0 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {isExpanded && (
                <div className="flex flex-col gap-4 border-t border-gray-100 p-4 dark:border-gray-800">
                  {plan.workout_split.map((day, dayIndex) => (
                    <div key={dayIndex}>
                      <h3 className="mb-2 text-sm font-semibold">
                        {day.day} — {day.focus}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {day.exercises.map((exercise, i) => (
                          <div
                            key={i}
                            className="flex gap-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-950/60"
                          >
                            <ExerciseThumbnail
                              src={exercise.image_url}
                              alt={exercise.name}
                              onClick={() => {
                                const full = exercise.image_full_url ?? exercise.image_url;
                                if (full) setLightboxImage({ src: full, alt: exercise.name });
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">
                                {exercise.name}{" "}
                                <span className="font-normal text-gray-500 dark:text-gray-400">
                                  — {exercise.sets} × {exercise.reps}
                                </span>
                              </p>
                              {exercise.equipment && (
                                <p className="text-gray-500 dark:text-gray-400">{exercise.equipment}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Flame size={14} className="text-blue-600 dark:text-blue-400" />
                      {t("gymPlanView.nutritionTitle")}
                    </h3>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant="blue">
                        {plan.nutrition.daily_calories} {t("gymPlanView.perDay")}
                      </Badge>
                      <Badge variant="gray">
                        {plan.nutrition.macros.protein_g}g {t("gymPlanView.protein")}
                      </Badge>
                      <Badge variant="gray">
                        {plan.nutrition.macros.carbs_g}g {t("gymPlanView.carbs")}
                      </Badge>
                      <Badge variant="gray">
                        {plan.nutrition.macros.fat_g}g {t("gymPlanView.fat")}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {plan.nutrition.meal_suggestions.map((meal, i) => {
                        const MealIcon = getMealIcon(meal);
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-950/60 dark:text-gray-400"
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                              <MealIcon size={14} />
                            </span>
                            <span>{meal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Pill size={14} className="text-blue-600 dark:text-blue-400" />
                      {t("gymPlanView.supplementsTitle")}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {plan.supplements.map((supplement, i) => (
                        <div key={i} className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-950/60">
                          <p className="font-medium">
                            {supplement.name}{" "}
                            <span className="font-normal text-gray-500 dark:text-gray-400">
                              — {supplement.timing}
                            </span>
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">{supplement.reason}</p>
                          {supplement.brands && supplement.brands.length > 0 && (
                            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                              <Tag size={11} />
                              {supplement.brands.join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Alert variant="info">{t("gymPlanView.disclaimer")}</Alert>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleActivate(plan)}
                      disabled={activatingId === plan.id}
                      className="btn-primary !px-3 !py-1.5 !text-xs disabled:pointer-events-none disabled:opacity-60"
                    >
                      {activatingId === plan.id && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      )}
                      {t("gymSavedPlans.activate")}
                    </button>
                    <button
                      onClick={() => setSendTarget(plan)}
                      aria-label={t("gymPlanView.sendButton")}
                      title={t("gymPlanView.sendButton")}
                      className="grid h-8 w-8 place-items-center rounded-full bg-blue-600/10 text-blue-600 transition-colors hover:bg-blue-600/15 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/20"
                    >
                      <Send size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(plan)}
                      aria-label={t("common.delete")}
                      className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("gymSavedPlans.confirmDeleteTitle", { name: deleteTarget?.name })}
        description={t("common.irreversible")}
        confirmLabel={t("common.delete")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}

      <SendPlanModal
        open={sendTarget !== null}
        sending={sending}
        onSend={handleSend}
        onClose={() => setSendTarget(null)}
      />
    </div>
  );
}
