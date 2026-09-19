import { Dumbbell, Footprints } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../api/admin";
import type { Activity } from "../api/activities";
import type { GymPlan, GymProfile, SavedGymPlan } from "../api/gym";
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

type ProgressTab = "running" | "gym";

export function UserProgressModal({ open, onClose, user }: UserProgressModalProps) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<ProgressTab>("running");
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [gymProfile, setGymProfile] = useState<GymProfile | null>(null);
  const [gymPlan, setGymPlan] = useState<GymPlan | null>(null);
  const [gymSaved, setGymSaved] = useState<SavedGymPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    setTab("running");
    setLoading(true);
    Promise.all([
      adminApi.userStats(user.id),
      adminApi.userActivities(user.id),
      adminApi.userGymProfile(user.id),
      adminApi.userGymPlan(user.id),
      adminApi.userGymSavedPlans(user.id),
    ])
      .then(([s, a, gymProfileRes, gymPlanRes, gymSavedRes]) => {
        setStats(s);
        setActivities(a);
        setGymProfile(gymProfileRes);
        setGymPlan(gymPlanRes);
        setGymSaved(gymSavedRes);
      })
      .finally(() => setLoading(false));
  }, [open, user]);

  const tabClass = (isActive: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      isActive
        ? "bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400"
        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    }`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? t("userProgressModal.title", { name: user.name }) : t("userProgressModal.titleFallback")}
      maxWidth="max-w-lg"
    >
      {loading && <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>}

      {!loading && (
        <div className="flex flex-col gap-4">
          <div className="flex w-fit gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
            <button onClick={() => setTab("running")} className={tabClass(tab === "running")}>
              <Footprints size={13} />
              {t("sidebar.running")}
            </button>
            <button onClick={() => setTab("gym")} className={tabClass(tab === "gym")}>
              <Dumbbell size={13} />
              {t("sidebar.gym")}
            </button>
          </div>

          {tab === "running" && stats && (
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

          {tab === "gym" && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t("userProgressModal.gymProfileTitle")}
                </h3>
                {gymProfile ? (
                  <div className="flex flex-wrap gap-2 text-sm">
                    <Badge variant="blue">{gymProfile.goal}</Badge>
                    <Badge variant="gray">{gymProfile.level}</Badge>
                    <Badge variant="gray">{gymProfile.equipment}</Badge>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("userProgressModal.noGymProfile")}
                  </p>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t("userProgressModal.currentGymPlan")}
                </h3>
                {gymPlan ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="blue">{gymPlan.goal ?? t("gymPlanView.goalUndefined")}</Badge>
                    <Badge variant="gray">
                      {t("userProgressModal.daysCount", { count: gymPlan.workout_split.length })}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t("gymPlanView.generatedOn", {
                        date: new Date(gymPlan.generated_at).toLocaleDateString(
                          i18n.language === "en" ? "en-US" : "fr-FR",
                        ),
                      })}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("userProgressModal.noGymPlan")}</p>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {t("userProgressModal.savedGymPlans", { count: gymSaved.length })}
                </h3>
                {gymSaved.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t("gymSavedPlans.emptyTitle")}</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {gymSaved.map((saved) => (
                      <div
                        key={saved.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm dark:bg-gray-950/60"
                      >
                        <span className="min-w-0 truncate font-medium">{saved.name}</span>
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                          {saved.goal ?? t("gymPlanView.goalUndefined")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
