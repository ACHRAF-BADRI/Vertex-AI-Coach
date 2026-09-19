import { motion } from "framer-motion";
import { RefreshCw, Sparkles, Target, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { plansApi, type TrainingPlan } from "../api/plans";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";

export function PlanView() {
  const { t, i18n } = useTranslation();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    plansApi
      .current()
      .then(setPlan)
      .catch(() => setError(t("planView.loadError")))
      .finally(() => setLoading(false));
  }, []);

  const isFirstLangRender = useRef(true);
  useEffect(() => {
    if (isFirstLangRender.current) {
      isFirstLangRender.current = false;
      return;
    }
    if (!plan) return;
    const request =
      i18n.language === "en" ? plansApi.translate("en") : plansApi.current();
    request
      .then((translated) => {
        if (translated) setPlan(translated);
      })
      .catch((err: any) => {
        toast.error(err.response?.data?.error ?? t("planView.translateErrorDefault"));
      });
  }, [i18n.language]);

  const handleGenerate = async () => {
    setConfirmRegenerateOpen(false);
    setGenerating(true);
    setError(null);
    try {
      setPlan(await plansApi.generate());
      toast.success(t("planView.generatedToast"));
    } catch (err: any) {
      const message = err.response?.data?.error ?? t("planView.generateErrorDefault");
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
      await plansApi.remove();
      setPlan(null);
      toast.success(t("planView.deletedToast"));
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("planView.deleteErrorDefault"));
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{t("planView.title")}</h1>
        <div className="flex items-center gap-2 mr-20">
          <button onClick={handleGenerateClick} disabled={generating} className="btn-primary">
            {generating ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : plan ? (
              <RefreshCw size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            {generating ? t("planView.generating") : plan ? t("planView.regenerate") : t("planView.generate")}
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
          icon={<Sparkles size={28} />}
          title={t("planView.emptyTitle")}
          description={t("planView.emptyDescription")}
        />
      )}

      {plan && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Badge variant="blue" icon={<Target size={12} />}>
              {plan.goal ?? t("planView.goalUndefined")}
            </Badge>
            <Badge variant="green">{t("common.active")}</Badge>
            <span>
              {t("planView.generatedOn", {
                date: new Date(plan.generated_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR"),
              })}
            </span>
          </div>
          {plan.weeks.map((week, weekIndex) => (
            <motion.div
              key={week.week_number}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: weekIndex * 0.06, duration: 0.25 }}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {week.week_number}
                </span>
                <h2 className="text-lg font-semibold">{week.focus}</h2>
              </div>
              <div className="flex flex-col gap-2">
                {week.sessions.map((session, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-gray-50 p-3 text-sm transition-colors hover:bg-gray-100 dark:bg-gray-950/60 dark:hover:bg-gray-800/60"
                  >
                    <p className="font-medium">
                      {session.day} — {session.type}{" "}
                      <span className="font-normal text-gray-500 dark:text-gray-400">({session.intensity})</span>
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {session.distance_km} km · {session.duration_min} min
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">{session.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title={t("planView.confirmDeleteTitle")}
        description={t("planView.confirmDeleteDescription")}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />

      <ConfirmDialog
        open={confirmRegenerateOpen}
        variant="default"
        title={t("planView.confirmRegenerateTitle")}
        description={t("planView.confirmRegenerateDescription")}
        confirmLabel={t("planView.regenerate")}
        onConfirm={handleGenerate}
        onCancel={() => setConfirmRegenerateOpen(false)}
      />
    </div>
  );
}
