import { motion } from "framer-motion";
import {
  Dumbbell,
  Flame,
  PersonStanding,
  Pill,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { gymApi, type GymPlan } from "../api/gym";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";

type TabKey = "workout" | "nutrition" | "supplements";

// Visual progression: gentle start -> building momentum -> visible strength -> final result
const MILESTONE_ICONS = [PersonStanding, TrendingUp, Dumbbell, Trophy];

function ResultsTimeline({ plan }: { plan: GymPlan }) {
  const { t } = useTranslation();
  const results = plan.expected_results;
  if (!results || results.milestones.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold">{t("gymPlanView.resultsTitle")}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t("gymPlanView.resultsIntro")}{" "}
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {t("gymPlanView.resultsWeeks", { count: results.weeks_to_see_results })}
        </span>{" "}
        {t("gymPlanView.resultsOutro")}
      </p>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {results.milestones.map((milestone, i) => {
          const intensity = Math.min(1, milestone.week / results.weeks_to_see_results);
          const Icon = MILESTONE_ICONS[Math.min(i, MILESTONE_ICONS.length - 1)];
          return (
            <div
              key={i}
              className="flex min-w-[130px] flex-1 flex-col items-center gap-2 rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-950/60"
            >
              <div
                className="grid h-14 w-14 place-items-center rounded-full"
                style={{ backgroundColor: `rgba(37, 99, 235, ${0.12 + intensity * 0.28})` }}
              >
                <Icon
                  size={28}
                  style={{ color: `rgba(37, 99, 235, ${0.45 + intensity * 0.55})` }}
                  strokeWidth={2}
                />
              </div>
              <Badge variant="blue">{t("gymPlanView.week", { week: milestone.week })}</Badge>
              <p className="text-xs text-gray-600 dark:text-gray-400">{milestone.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GymPlanView() {
  const { t, i18n } = useTranslation();
  const TABS = [
    { key: "workout" as const, label: t("gymPlanView.tabWorkout"), icon: Dumbbell },
    { key: "nutrition" as const, label: t("gymPlanView.tabNutrition"), icon: Flame },
    { key: "supplements" as const, label: t("gymPlanView.tabSupplements"), icon: Pill },
  ];
  const [plan, setPlan] = useState<GymPlan | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("workout");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gymApi
      .currentPlan()
      .then(setPlan)
      .catch(() => setError(t("gymPlanView.loadError")))
      .finally(() => setLoading(false));
  }, []);

  const isFirstLangRender = useRef(true);
  useEffect(() => {
    if (isFirstLangRender.current) {
      isFirstLangRender.current = false;
      return;
    }
    if (!plan) return;
    const request = i18n.language === "en" ? gymApi.translatePlan("en") : gymApi.currentPlan();
    request.then((translated) => {
      if (translated) setPlan(translated);
    });
  }, [i18n.language]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      setPlan(await gymApi.generatePlan());
      toast.success(t("gymPlanView.generatedToast"));
    } catch (err: any) {
      const message = err.response?.data?.error ?? t("gymPlanView.generateErrorDefault");
      setError(message);
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await gymApi.deletePlan();
      setPlan(null);
      toast.success(t("gymPlanView.deletedToast"));
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("gymPlanView.deleteErrorDefault"));
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{t("gymPlanView.title")}</h1>
        <div className="mr-20 flex items-center gap-2">
          <button onClick={handleGenerate} disabled={generating} className="btn-primary">
            {generating ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : plan ? (
              <RefreshCw size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            {generating ? t("gymPlanView.generating") : plan ? t("gymPlanView.regenerate") : t("gymPlanView.generate")}
          </button>
          {plan && (
            <button
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={deleting}
              aria-label={t("common.delete")}
              className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-600 transition-all hover:bg-red-100 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {loading && <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !plan && !error && (
        <EmptyState
          icon={<Dumbbell size={28} />}
          title={t("gymPlanView.emptyTitle")}
          description={t("gymPlanView.emptyDescription")}
          action={
            <Link to="/gym/profile" className="btn-primary">
              {t("gymPlanView.fillProfile")}
            </Link>
          }
        />
      )}

      {plan && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Badge variant="blue" icon={<Target size={12} />}>
              {plan.goal ?? t("gymPlanView.goalUndefined")}
            </Badge>
            <Badge variant="green">{t("common.active")}</Badge>
            <span>
              {t("gymPlanView.generatedOn", {
                date: new Date(plan.generated_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR"),
              })}
            </span>
          </div>

          <ResultsTimeline plan={plan} />

          <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-gray-100 p-1 dark:bg-gray-800">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "workout" &&
            plan.workout_split.map((day, dayIndex) => (
              <motion.div
                key={day.day + dayIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.06, duration: 0.25 }}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    <Dumbbell size={14} />
                  </span>
                  <h2 className="text-lg font-semibold">
                    {day.day} — {day.focus}
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  {day.exercises.map((exercise, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-gray-50 p-3 text-sm transition-colors hover:bg-gray-100 dark:bg-gray-950/60 dark:hover:bg-gray-800/60"
                    >
                      <p className="font-medium">
                        {exercise.name}{" "}
                        <span className="font-normal text-gray-500 dark:text-gray-400">
                          — {exercise.sets} × {exercise.reps} · {t("gymPlanView.restLabel")} {exercise.rest_sec}s
                        </span>
                      </p>
                      {exercise.equipment && (
                        <p className="text-gray-500 dark:text-gray-400">
                          {t("gymPlanView.equipmentLabel")} : {exercise.equipment}
                        </p>
                      )}
                      {exercise.notes && <p className="text-gray-500 dark:text-gray-400">{exercise.notes}</p>}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}

          {activeTab === "nutrition" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 flex items-center gap-2">
                <Flame size={18} className="text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold">{t("gymPlanView.nutritionTitle")}</h2>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
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
              <ul className="flex flex-col gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                {plan.nutrition.meal_suggestions.map((meal, i) => (
                  <li key={i}>• {meal}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "supplements" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 flex items-center gap-2">
                <Pill size={18} className="text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold">{t("gymPlanView.supplementsTitle")}</h2>
              </div>
              <div className="mb-3 flex flex-col gap-2">
                {plan.supplements.map((supplement, i) => (
                  <div key={i} className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-950/60">
                    <p className="font-medium">
                      {supplement.name}{" "}
                      <span className="font-normal text-gray-500 dark:text-gray-400">— {supplement.timing}</span>
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">{supplement.reason}</p>
                  </div>
                ))}
              </div>
              <Alert variant="info">{t("gymPlanView.disclaimer")}</Alert>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t("gymPlanView.confirmDeleteTitle")}
        description={t("gymPlanView.confirmDeleteDescription")}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
