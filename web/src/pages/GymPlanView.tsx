import { motion } from "framer-motion";
import {
  Bookmark,
  ChevronRight,
  CirclePlay,
  Dumbbell,
  Flame,
  Library,
  PersonStanding,
  Pill,
  RefreshCw,
  Send,
  Sparkles,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { gymApi, type GymExercise, type GymPlan, type GymSupplement } from "../api/gym";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { ExerciseThumbnail, ImageLightbox } from "../components/ExerciseMedia";
import { Modal } from "../components/Modal";
import { SendPlanModal } from "../components/SendPlanModal";
import { getMealIcon } from "../utils/mealIcon";

type TabKey = "workout" | "nutrition" | "supplements";

function AlternativesModal({
  open,
  loading,
  alternatives,
  swappingIndex,
  onSelect,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  alternatives: GymExercise[];
  swappingIndex: number | null;
  onSelect: (exercise: GymExercise, index: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose} title={t("gymPlanView.alternativesTitle")}>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}
      {!loading && alternatives.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("gymPlanView.noAlternatives")}</p>
      )}
      <div className="flex flex-col gap-2">
        {alternatives.map((alt, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-950/60">
            <ExerciseThumbnail src={alt.image_url} alt={alt.name} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{alt.name}</p>
              <p className="text-gray-500 dark:text-gray-400">
                {alt.sets} × {alt.reps}
                {alt.equipment ? ` · ${alt.equipment}` : ""}
              </p>
            </div>
            <button
              onClick={() => onSelect(alt, i)}
              disabled={swappingIndex !== null}
              className="btn-secondary !px-3 !py-1.5 shrink-0 text-xs disabled:pointer-events-none disabled:opacity-60"
            >
              {swappingIndex === i ? (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400/40 border-t-gray-600 dark:border-t-gray-300" />
              ) : (
                t("gymPlanView.useAlternative")
              )}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function SavePlanModal({
  open,
  saving,
  onSave,
  onClose,
}: {
  open: boolean;
  saving: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={t("gymPlanView.saveModalTitle")}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onSave(name.trim());
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("gymPlanView.saveModalNameLabel")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("gymPlanView.saveModalNamePlaceholder")}
            required
            autoFocus
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {t("gymPlanView.saveModalConfirm")}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SupplementAlternativesModal({
  open,
  loading,
  alternatives,
  swappingIndex,
  onSelect,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  alternatives: GymSupplement[];
  swappingIndex: number | null;
  onSelect: (supplement: GymSupplement, index: number) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <Modal open={open} onClose={onClose} title={t("gymPlanView.supplementAlternativesTitle")}>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}
      {!loading && alternatives.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("gymPlanView.noAlternatives")}</p>
      )}
      <div className="flex flex-col gap-2">
        {alternatives.map((alt, i) => (
          <div key={i} className="rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-950/60">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {alt.name} <span className="font-normal text-gray-500 dark:text-gray-400">— {alt.timing}</span>
                </p>
                <p className="text-gray-500 dark:text-gray-400">{alt.reason}</p>
                {alt.brands && alt.brands.length > 0 && (
                  <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                    <Tag size={11} />
                    {alt.brands.join(", ")}
                  </p>
                )}
              </div>
              <button
                onClick={() => onSelect(alt, i)}
                disabled={swappingIndex !== null}
                className="btn-secondary !px-3 !py-1.5 shrink-0 text-xs disabled:pointer-events-none disabled:opacity-60"
              >
                {swappingIndex === i ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-400/40 border-t-gray-600 dark:border-t-gray-300" />
                ) : (
                  t("gymPlanView.useAlternative")
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

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
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alternativesFor, setAlternativesFor] = useState<{
    dayIndex: number;
    exerciseIndex: number;
  } | null>(null);
  const [alternatives, setAlternatives] = useState<GymExercise[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const [supplementAlternativesFor, setSupplementAlternativesFor] = useState<number | null>(null);
  const [supplementAlternatives, setSupplementAlternatives] = useState<GymSupplement[]>([]);
  const [loadingSupplementAlternatives, setLoadingSupplementAlternatives] = useState(false);
  const [swappingSupplementIndex, setSwappingSupplementIndex] = useState<number | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [sending, setSending] = useState(false);

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
    request
      .then((translated) => {
        if (translated) setPlan(translated);
      })
      .catch((err: any) => {
        toast.error(err.response?.data?.error ?? t("gymPlanView.translateErrorDefault"));
      });
  }, [i18n.language]);

  const handleGenerate = async () => {
    setConfirmRegenerateOpen(false);
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

  const handleGenerateClick = () => {
    if (plan) {
      setConfirmRegenerateOpen(true);
    } else {
      handleGenerate();
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

  const handleSavePlan = async (name: string) => {
    setSaving(true);
    try {
      await gymApi.savePlan(name);
      toast.success(t("gymPlanView.savedToast"));
      setSaveModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("gymPlanView.saveErrorDefault"));
    } finally {
      setSaving(false);
    }
  };

  const openAlternatives = async (dayIndex: number, exerciseIndex: number, exercise: GymExercise) => {
    setAlternativesFor({ dayIndex, exerciseIndex });
    setAlternatives([]);
    setLoadingAlternatives(true);
    try {
      setAlternatives(await gymApi.exerciseAlternatives(exercise.name, exercise.name_en, exercise.equipment));
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("gymPlanView.alternativesErrorDefault"));
      setAlternativesFor(null);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleSwapExercise = async (alternative: GymExercise, index: number) => {
    if (!alternativesFor) return;
    setSwappingIndex(index);
    try {
      const updated = await gymApi.replaceExercise(
        alternativesFor.dayIndex,
        alternativesFor.exerciseIndex,
        alternative,
      );
      setPlan(updated);
      toast.success(t("gymPlanView.exerciseSwappedToast"));
      setAlternativesFor(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setSwappingIndex(null);
    }
  };

  const openSupplementAlternatives = async (supplementIndex: number, supplement: GymSupplement) => {
    setSupplementAlternativesFor(supplementIndex);
    setSupplementAlternatives([]);
    setLoadingSupplementAlternatives(true);
    try {
      setSupplementAlternatives(await gymApi.supplementAlternatives(supplement.name, supplement.reason));
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("gymPlanView.alternativesErrorDefault"));
      setSupplementAlternativesFor(null);
    } finally {
      setLoadingSupplementAlternatives(false);
    }
  };

  const handleSwapSupplement = async (alternative: GymSupplement, index: number) => {
    if (supplementAlternativesFor === null) return;
    setSwappingSupplementIndex(index);
    try {
      const updated = await gymApi.replaceSupplement(supplementAlternativesFor, alternative);
      setPlan(updated);
      toast.success(t("gymPlanView.exerciseSwappedToast"));
      setSupplementAlternativesFor(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setSwappingSupplementIndex(null);
    }
  };

  const handleSend = async (email: string, name: string) => {
    setSending(true);
    try {
      await gymApi.sendPlan(email, name);
      toast.success(t("gymPlanView.sentToast"));
      setSendModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{t("gymPlanView.title")}</h1>
        <div className="mr-20 flex items-center gap-2">
          <Link
            to="/gym/saved"
            aria-label={t("gymPlanView.viewSaved")}
            title={t("gymPlanView.viewSaved")}
            className="btn-icon"
          >
            <Library size={16} />
          </Link>
          <button onClick={handleGenerateClick} disabled={generating} className="btn-primary">
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
              onClick={() => setSaveModalOpen(true)}
              aria-label={t("gymPlanView.saveButton")}
              title={t("gymPlanView.saveButton")}
              className="grid h-9 w-9 place-items-center rounded-full bg-blue-600/10 text-blue-600 transition-colors hover:bg-blue-600/15 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/20"
            >
              <Bookmark size={16} />
            </button>
          )}
          {plan && (
            <button
              onClick={() => setSendModalOpen(true)}
              aria-label={t("gymPlanView.sendButton")}
              title={t("gymPlanView.sendButton")}
              className="grid h-9 w-9 place-items-center rounded-full bg-blue-600/10 text-blue-600 transition-colors hover:bg-blue-600/15 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/20"
            >
              <Send size={16} />
            </button>
          )}
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
                      className="flex gap-3 rounded-xl bg-gray-50 p-3 text-sm transition-colors hover:bg-gray-100 dark:bg-gray-950/60 dark:hover:bg-gray-800/60"
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
                            — {exercise.sets} × {exercise.reps} · {t("gymPlanView.restLabel")} {exercise.rest_sec}s
                          </span>
                        </p>
                        {exercise.equipment && (
                          <p className="text-gray-500 dark:text-gray-400">
                            {t("gymPlanView.equipmentLabel")} : {exercise.equipment}
                          </p>
                        )}
                        {exercise.notes && <p className="text-gray-500 dark:text-gray-400">{exercise.notes}</p>}
                        {exercise.video_url && (
                          <a
                            href={exercise.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                          >
                            <CirclePlay size={13} />
                            {t("gymPlanView.watchVideo")}
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => openAlternatives(dayIndex, i, exercise)}
                        aria-label={t("gymPlanView.seeAlternatives")}
                        title={t("gymPlanView.seeAlternatives")}
                        className="grid h-8 w-8 shrink-0 place-items-center self-center rounded-full text-gray-400 transition-colors hover:bg-blue-600/10 hover:text-blue-600 dark:text-gray-500 dark:hover:bg-blue-500/15 dark:hover:text-blue-400"
                      >
                        <ChevronRight size={16} />
                      </button>
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
              <div className="flex flex-col gap-2">
                {plan.nutrition.meal_suggestions.map((meal, i) => {
                  const MealIcon = getMealIcon(meal);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-950/60 dark:text-gray-400"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                        <MealIcon size={16} />
                      </span>
                      <span>{meal}</span>
                    </div>
                  );
                })}
              </div>
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
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-950/60"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                      <Pill size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {supplement.name}{" "}
                        <span className="font-normal text-gray-500 dark:text-gray-400">— {supplement.timing}</span>
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">{supplement.reason}</p>
                      {supplement.brands && supplement.brands.length > 0 && (
                        <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                          <Tag size={11} />
                          {supplement.brands.join(", ")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openSupplementAlternatives(i, supplement)}
                      aria-label={t("gymPlanView.seeAlternatives")}
                      title={t("gymPlanView.seeAlternatives")}
                      className="grid h-8 w-8 shrink-0 place-items-center self-center rounded-full text-gray-400 transition-colors hover:bg-blue-600/10 hover:text-blue-600 dark:text-gray-500 dark:hover:bg-blue-500/15 dark:hover:text-blue-400"
                    >
                      <ChevronRight size={16} />
                    </button>
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

      <ConfirmDialog
        open={confirmRegenerateOpen}
        variant="default"
        title={t("gymPlanView.confirmRegenerateTitle")}
        description={t("gymPlanView.confirmRegenerateDescription")}
        confirmLabel={t("gymPlanView.regenerate")}
        onConfirm={handleGenerate}
        onCancel={() => setConfirmRegenerateOpen(false)}
      />

      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          onClose={() => setLightboxImage(null)}
        />
      )}

      <SavePlanModal
        open={saveModalOpen}
        saving={saving}
        onSave={handleSavePlan}
        onClose={() => setSaveModalOpen(false)}
      />

      <AlternativesModal
        open={alternativesFor !== null}
        loading={loadingAlternatives}
        alternatives={alternatives}
        swappingIndex={swappingIndex}
        onSelect={handleSwapExercise}
        onClose={() => setAlternativesFor(null)}
      />

      <SupplementAlternativesModal
        open={supplementAlternativesFor !== null}
        loading={loadingSupplementAlternatives}
        alternatives={supplementAlternatives}
        swappingIndex={swappingSupplementIndex}
        onSelect={handleSwapSupplement}
        onClose={() => setSupplementAlternativesFor(null)}
      />

      <SendPlanModal
        open={sendModalOpen}
        sending={sending}
        onSend={handleSend}
        onClose={() => setSendModalOpen(false)}
      />
    </div>
  );
}
