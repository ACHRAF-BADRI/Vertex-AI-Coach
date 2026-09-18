import type { ReactNode } from "react";

const VARIANTS = {
  blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-400/20",
  green:
    "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-400/20",
  amber:
    "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20",
  gray: "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-300 dark:ring-white/10",
};

interface BadgeProps {
  children: ReactNode;
  variant?: keyof typeof VARIANTS;
  icon?: ReactNode;
}

export function Badge({ children, variant = "gray", icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${VARIANTS[variant]}`}
    >
      {icon}
      {children}
    </span>
  );
}
