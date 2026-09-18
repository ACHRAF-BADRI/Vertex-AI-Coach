import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../api/admin";
import type { Activity } from "../api/activities";
import type { StatsSummary } from "../api/stats";
import type { User } from "../context/AuthContext";
import { formatPace } from "../utils/format";
import { FEELING_ICON } from "../utils/feeling";
import { Badge } from "./Badge";
import { Modal } from "./Modal";
import { StatTile } from "./StatTile";

interface UserProgressModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export function UserProgressModal({ open, onClose, user }: UserProgressModalProps) {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    Promise.all([adminApi.userStats(user.id), adminApi.userActivities(user.id)])
      .then(([s, a]) => {
        setStats(s);
        setActivities(a);
      })
      .finally(() => setLoading(false));
  }, [open, user]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? t("userProgressModal.title", { name: user.name }) : t("userProgressModal.titleFallback")}
      maxWidth="max-w-lg"
    >
      {loading && <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && stats && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label={t("userProgressModal.statDistance")} value={`${stats.total_distance_km} km`} />
            <StatTile label={t("userProgressModal.statActivities")} value={String(stats.total_activities)} />
            <StatTile label={t("userProgressModal.statPace")} value={formatPace(stats.avg_pace)} />
            <StatTile label={t("userProgressModal.statCalories")} value={`${stats.total_calories} kcal`} />
            <StatTile
              label={t("userProgressModal.statSteps")}
              value={stats.total_steps.toLocaleString(i18n.language === "en" ? "en-US" : "fr-FR")}
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("userProgressModal.recentActivities")}
            </h3>
            {activities.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("userProgressModal.noActivities")}</p>
            )}
            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm dark:bg-gray-950/60"
                >
                  <span className="min-w-0 break-words">
                    {a.date} — {a.distance_km} km en {a.duration_min} min
                  </span>
                  {a.feeling && FEELING_ICON[a.feeling] && (
                    <Badge variant="gray">{t(`feeling.${a.feeling}`, a.feeling)}</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
