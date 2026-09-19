import { Footprints, MapPin, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { stepsApi, type StepSession } from "../api/steps";
import { Alert } from "../components/Alert";
import { EmptyState } from "../components/EmptyState";
import { StatTile } from "../components/StatTile";
import { useTheme } from "../context/ThemeContext";

const PALETTE = {
  light: { accent: "#2a78d6", grid: "#e1e0d9", axis: "#c3c2b7", muted: "#898781", surface: "#fcfcfb", text: "#0b0b0b" },
  dark: { accent: "#3987e5", grid: "#2c2c2a", axis: "#383835", muted: "#898781", surface: "#1a1a19", text: "#ffffff" },
};

function dayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekStart(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
  return copy;
}

function formatDuration(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
}

export function StepsDashboard() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const colors = PALETTE[theme];
  const locale = i18n.language === "en" ? "en-US" : "fr-FR";

  const [sessions, setSessions] = useState<StepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    stepsApi
      .list()
      .then(setSessions)
      .catch(() => setError(t("stepsDashboard.loadError")))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(() => {
    const steps = sessions.reduce((sum, s) => sum + s.steps, 0);
    const distance = sessions.reduce((sum, s) => sum + s.distance_km, 0);
    const calories = sessions.reduce((sum, s) => sum + s.calories, 0);
    const duration = sessions.reduce((sum, s) => sum + s.duration_sec, 0);
    const best = sessions.reduce<StepSession | null>((b, s) => (!b || s.distance_km > b.distance_km ? s : b), null);
    return { steps, distance, calories, duration, best };
  }, [sessions]);

  const daily = useMemo(() => {
    const days: { key: string; label: string; steps: number }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      days.push({ key: dayKey(d), label: d.toLocaleDateString(locale, { day: "numeric", month: "short" }), steps: 0 });
    }
    for (const s of sessions) {
      const entry = days.find((d) => d.key === dayKey(new Date(s.started_at)));
      if (entry) entry.steps += s.steps;
    }
    return days;
  }, [sessions, locale]);

  const weekly = useMemo(() => {
    const weeks: { key: string; label: string; distance: number }[] = [];
    const current = weekStart(new Date());
    for (let i = 7; i >= 0; i--) {
      const d = new Date(current.getFullYear(), current.getMonth(), current.getDate() - i * 7);
      weeks.push({ key: dayKey(d), label: d.toLocaleDateString(locale, { day: "numeric", month: "short" }), distance: 0 });
    }
    for (const s of sessions) {
      const entry = weeks.find((w) => w.key === dayKey(weekStart(new Date(s.started_at))));
      if (entry) entry.distance = Math.round((entry.distance + s.distance_km) * 100) / 100;
    }
    return weeks;
  }, [sessions, locale]);

  const tooltipStyle = {
    background: colors.surface,
    border: `1px solid ${colors.grid}`,
    borderRadius: 10,
    color: colors.text,
    fontSize: 13,
  };

  const avgSteps = sessions.length ? Math.round(totals.steps / sessions.length) : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{t("stepsDashboard.title")}</h1>
        <Link to="/steps" className="btn-primary">
          <Play size={16} />
          {t("stepsDashboard.startTracking")}
        </Link>
      </div>

      {loading && <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && sessions.length === 0 && (
        <EmptyState
          icon={<MapPin size={28} />}
          title={t("stepsDashboard.emptyTitle")}
          description={t("stepsDashboard.emptyDescription")}
        />
      )}

      {sessions.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <StatTile label={t("stepsDashboard.totalSteps")} value={totals.steps.toLocaleString(locale)} />
            <StatTile label={t("stepsDashboard.totalDistance")} value={`${totals.distance.toFixed(1)} km`} />
            <StatTile label={t("stepsDashboard.totalCalories")} value={`${totals.calories} kcal`} />
            <StatTile label={t("stepsDashboard.totalTime")} value={formatDuration(totals.duration)} />
            <StatTile label={t("stepsDashboard.sessions")} value={String(sessions.length)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Footprints size={18} />
              </span>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("stepsDashboard.avgSteps")}</p>
                <p className="text-lg font-semibold">{avgSteps.toLocaleString(locale)}</p>
              </div>
            </div>
            {totals.best && (
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                  <MapPin size={18} />
                </span>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("stepsDashboard.bestSession")}</p>
                  <p className="text-lg font-semibold">
                    {totals.best.distance_km.toFixed(2)} km ·{" "}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      {new Date(totals.best.started_at).toLocaleDateString(locale, { day: "numeric", month: "short" })}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("stepsDashboard.dailyChart")}
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={daily} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stepsBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.accent} stopOpacity={1} />
                      <stop offset="100%" stopColor={colors.accent} stopOpacity={0.55} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={colors.grid} />
                  <XAxis
                    dataKey="label"
                    stroke={colors.axis}
                    tick={{ fill: colors.muted, fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis stroke={colors.axis} tick={{ fill: colors.muted, fontSize: 11 }} width={44} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: colors.accent, fillOpacity: 0.06 }}
                    formatter={(value: number) => [value.toLocaleString(locale), t("stepsDashboard.stepsLabel")]}
                  />
                  <Bar dataKey="steps" fill="url(#stepsBar)" radius={[6, 6, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t("stepsDashboard.weeklyChart")}
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={weekly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="distArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.accent} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={colors.accent} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={colors.grid} />
                  <XAxis
                    dataKey="label"
                    stroke={colors.axis}
                    tick={{ fill: colors.muted, fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />
                  <YAxis stroke={colors.axis} tick={{ fill: colors.muted, fontSize: 11 }} width={36} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: colors.accent, strokeOpacity: 0.3 }}
                    formatter={(value: number) => [`${value} km`, t("stepsDashboard.distanceLabel")]}
                  />
                  <Area
                    type="monotone"
                    dataKey="distance"
                    stroke={colors.accent}
                    strokeWidth={2}
                    fill="url(#distArea)"
                    dot={{ r: 3.5, strokeWidth: 2, stroke: colors.surface, fill: colors.accent }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
