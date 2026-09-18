import { motion } from "framer-motion";
import { Footprints, RefreshCw, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { statsApi, type StatsSummary } from "../api/stats";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { Banner } from "../components/Banner";
import { EmptyState } from "../components/EmptyState";
import { StatTile } from "../components/StatTile";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { formatPace, formatShortDate } from "../utils/format";

const PALETTE = {
  light: { accent: "#2a78d6", grid: "#e1e0d9", axis: "#c3c2b7", muted: "#898781", surface: "#fcfcfb", text: "#0b0b0b" },
  dark: { accent: "#3987e5", grid: "#2c2c2a", axis: "#383835", muted: "#898781", surface: "#1a1a19", text: "#ffffff" },
};

export function Dashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = PALETTE[theme];

  const loadStats = () => {
    return statsApi
      .summary()
      .then(setStats)
      .catch(() => setError(t("dashboard.loadError")));
  };

  useEffect(() => {
    loadStats().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    await loadStats();
    setRefreshing(false);
    toast.success(t("dashboard.refreshed"));
  };

  const tooltipStyle = {
    background: colors.surface,
    border: `1px solid ${colors.grid}`,
    borderRadius: 10,
    color: colors.text,
    fontSize: 13,
  };

  const refreshButtonIcon = (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      aria-label={t("common.refresh")}
      className="grid h-9 w-9 place-items-center rounded-full bg-blue-600/10 text-blue-600 transition-colors hover:bg-blue-600/15 disabled:pointer-events-none disabled:opacity-60 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/20"
    >
      <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:pt-8">
      <div className="mb-6 sm:hidden">
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600/10 px-5 py-2.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600/15 disabled:pointer-events-none disabled:opacity-60 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/20"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          {t("common.refresh")}
        </button>
      </div>

      <div className="mb-6 hidden sm:block">
        <Banner
          title={t("dashboard.greeting", { name: user?.name })}
          subtitle={t("dashboard.subtitle")}
          action={refreshButtonIcon}
        >
          <Badge variant="blue" icon={<Target size={12} />}>
            {t("dashboard.goalBadge", { goal: user?.goal ?? t("dashboard.goalUndefined") })}
          </Badge>
        </Banner>
      </div>

      {loading && <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>}
      {error && <Alert variant="error">{error}</Alert>}

      {stats && stats.total_activities === 0 && (
        <EmptyState
          icon={<Footprints size={28} />}
          title={t("dashboard.emptyTitle")}
          description={t("dashboard.emptyDescription")}
          action={
            <Link to="/training-log" className="btn-primary">
              {t("dashboard.addFirst")}
            </Link>
          }
        />
      )}

      {stats && stats.total_activities > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-6"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label={t("dashboard.statDistance")} value={`${stats.total_distance_km} km`} />
            <StatTile label={t("dashboard.statActivities")} value={String(stats.total_activities)} />
            <StatTile label={t("dashboard.statPace")} value={formatPace(stats.avg_pace)} />
            <StatTile label={t("dashboard.statCalories")} value={`${stats.total_calories} kcal`} />
            <StatTile
              label={t("dashboard.statSteps")}
              value={stats.total_steps.toLocaleString(i18n.language === "en" ? "en-US" : "fr-FR")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("dashboard.weeklyVolume")}
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.weekly_volume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.accent} stopOpacity={1} />
                      <stop offset="100%" stopColor={colors.accent} stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={colors.grid} />
                  <XAxis
                    dataKey="week_start"
                    tickFormatter={formatShortDate}
                    stroke={colors.axis}
                    tick={{ fill: colors.muted, fontSize: 12 }}
                  />
                  <YAxis stroke={colors.axis} tick={{ fill: colors.muted, fontSize: 12 }} width={36} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: colors.accent, fillOpacity: 0.06 }}
                    labelFormatter={formatShortDate}
                    formatter={(value: number) => [`${value} km`, t("dashboard.tooltipDistance")]}
                  />
                  <Bar dataKey="distance_km" fill="url(#barFill)" radius={[6, 6, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("dashboard.paceEvolution")}
              </h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={stats.pace_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.accent} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={colors.accent} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={colors.grid} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    stroke={colors.axis}
                    tick={{ fill: colors.muted, fontSize: 12 }}
                  />
                  <YAxis
                    stroke={colors.axis}
                    tick={{ fill: colors.muted, fontSize: 12 }}
                    width={36}
                    domain={["dataMin - 1", "dataMax + 1"]}
                    tickFormatter={(v: number) => `${v}'`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: colors.accent, strokeOpacity: 0.3 }}
                    labelFormatter={formatShortDate}
                    formatter={(value: number) => [formatPace(value), t("dashboard.tooltipPace")]}
                  />
                  <Area
                    type="monotone"
                    dataKey="pace"
                    stroke={colors.accent}
                    strokeWidth={2}
                    fill="url(#areaFill)"
                    dot={{ r: 4, strokeWidth: 2, stroke: colors.surface, fill: colors.accent }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: colors.surface, fill: colors.accent }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
