import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminApi, type AdminStats } from "../api/admin";
import { useTheme } from "../context/ThemeContext";
import { formatShortDate } from "../utils/format";
import { StatTile } from "./StatTile";

const PALETTE = {
  light: {
    accent: "#2a78d6",
    accent2: "#eb6834",
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    muted: "#898781",
    surface: "#fcfcfb",
    text: "#0b0b0b",
  },
  dark: {
    accent: "#3987e5",
    accent2: "#d95926",
    grid: "#2c2c2a",
    axis: "#383835",
    muted: "#898781",
    surface: "#1a1a19",
    text: "#ffffff",
  },
};

export function AdminStatsPanel({ refreshKey }: { refreshKey?: number }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const colors = PALETTE[theme];

  useEffect(() => {
    adminApi.stats().then(setStats);
  }, [refreshKey]);

  if (!stats) return null;

  const roleData = [
    { name: t("adminStats.legendUsers"), value: stats.total_users - stats.admin_count },
    { name: t("adminStats.legendAdmins"), value: stats.admin_count },
  ];

  const tooltipStyle = {
    background: colors.surface,
    border: `1px solid ${colors.grid}`,
    borderRadius: 10,
    color: colors.text,
    fontSize: 13,
  };

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label={t("adminStats.statUsers")} value={String(stats.total_users)} />
        <StatTile label={t("adminStats.statActive")} value={String(stats.active_users)} />
        <StatTile label={t("adminStats.statSuspended")} value={String(stats.suspended_users)} />
        <StatTile label={t("adminStats.statAdmins")} value={String(stats.admin_count)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{t("adminStats.signupsTitle")}</h2>
          {stats.signups_by_week.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{t("adminStats.noData")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.signups_by_week} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminBarFill" x1="0" y1="0" x2="0" y2="1">
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
                <YAxis allowDecimals={false} stroke={colors.axis} tick={{ fill: colors.muted, fontSize: 12 }} width={28} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: colors.accent, fillOpacity: 0.06 }}
                  labelFormatter={formatShortDate}
                  formatter={(value: number) => [value, t("adminStats.tooltipSignups")]}
                />
                <Bar dataKey="count" fill="url(#adminBarFill)" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{t("adminStats.rolesTitle")}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                <Cell fill={colors.accent} />
                <Cell fill={colors.accent2} />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, color: colors.muted }}
                formatter={(value: string) => <span style={{ color: colors.text }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
