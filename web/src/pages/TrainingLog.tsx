import { AnimatePresence, motion } from "framer-motion";
import { NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { activitiesApi, type Activity, type ActivityInput } from "../api/activities";
import { ActivityForm } from "../components/ActivityForm";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { FEELING_ICON } from "../utils/feeling";

const FEELING_VARIANT: Record<string, "red" | "amber" | "green" | "blue"> = {
  difficile: "red",
  moyen: "amber",
  bien: "green",
  excellent: "blue",
};

export function TrainingLog() {
  const { t, i18n } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const loadActivities = async () => {
    setLoading(true);
    try {
      setActivities(await activitiesApi.list());
      setError(null);
    } catch {
      setError(t("trainingLog.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleCreate = async (input: ActivityInput) => {
    const created = await activitiesApi.create(input);
    setActivities((prev) => [created, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setShowAddForm(false);
    toast.success(t("trainingLog.addedToast"));
  };

  const handleUpdate = async (id: string, input: ActivityInput) => {
    const updated = await activitiesApi.update(id, input);
    setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
    setEditingId(null);
    toast.success(t("trainingLog.updatedToast"));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await activitiesApi.remove(deleteTarget);
    setActivities((prev) => prev.filter((a) => a.id !== deleteTarget));
    toast.success(t("trainingLog.deletedToast"));
    setDeleteTarget(null);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold tracking-tight">{t("trainingLog.title")}</h1>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn-primary w-full sm:w-auto">
            <Plus size={16} />
            {t("trainingLog.addActivity")}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <ActivityForm
                submitLabel={t("trainingLog.addLabel")}
                onSubmit={handleCreate}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && activities.length === 0 && !showAddForm && (
        <EmptyState
          icon={<NotebookPen size={28} />}
          title={t("trainingLog.emptyTitle")}
          description={t("trainingLog.emptyDescription")}
        />
      )}

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {activities.map((activity) =>
            editingId === activity.id ? (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <ActivityForm
                  initialValues={{
                    date: activity.date,
                    distance_km: activity.distance_km,
                    duration_min: activity.duration_min,
                    feeling: activity.feeling ?? "",
                    notes: activity.notes ?? "",
                  }}
                  submitLabel={t("trainingLog.saveLabel")}
                  onSubmit={(input) => handleUpdate(activity.id, input)}
                  onCancel={() => setEditingId(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold break-words">
                      {activity.date} — {activity.distance_km} km en {activity.duration_min} min
                    </p>
                    {activity.feeling &&
                      FEELING_ICON[activity.feeling] &&
                      (() => {
                        const Feeling = FEELING_ICON[activity.feeling].icon;
                        return (
                          <Badge variant={FEELING_VARIANT[activity.feeling]} icon={<Feeling size={12} />}>
                            {t(`feeling.${activity.feeling}`, activity.feeling)}
                          </Badge>
                        );
                      })()}
                  </div>
                  <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">
                    {t("trainingLog.pace")} : {activity.pace ? `${activity.pace} min/km` : "—"}
                    {activity.calories && <span className="ml-2">· {activity.calories} kcal</span>}
                    {activity.steps && (
                      <span className="ml-2">
                        · {activity.steps.toLocaleString(i18n.language === "en" ? "en-US" : "fr-FR")}{" "}
                        {t("trainingLog.stepsUnit")}
                      </span>
                    )}
                    {activity.notes && <span className="ml-2">· {activity.notes}</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(activity.id)} aria-label={t("trainingLog.edit")} className="btn-icon !rounded-lg">
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(activity.id)}
                    aria-label={t("trainingLog.delete")}
                    className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 transition-colors hover:bg-red-100 active:scale-[0.98] dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </motion.div>
            ),
          )}
        </AnimatePresence>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("trainingLog.confirmDeleteTitle")}
        description={t("common.irreversible")}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
