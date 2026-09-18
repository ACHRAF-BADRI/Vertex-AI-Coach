import { AlertTriangle, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";

const VARIANTS = {
  info: {
    icon: Info,
    classes:
      "bg-blue-50 text-blue-800 ring-1 ring-inset ring-blue-600/15 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/15",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    classes:
      "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/15 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/15",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  error: {
    icon: XCircle,
    classes:
      "bg-red-50 text-red-800 ring-1 ring-inset ring-red-600/15 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/15",
    iconClass: "text-red-600 dark:text-red-400",
  },
};

interface AlertProps {
  variant?: keyof typeof VARIANTS;
  children: ReactNode;
}

export function Alert({ variant = "info", children }: AlertProps) {
  const { icon: Icon, classes, iconClass } = VARIANTS[variant];
  return (
    <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${classes}`}>
      <Icon size={18} className={`mt-0.5 shrink-0 ${iconClass}`} />
      <div>{children}</div>
    </div>
  );
}
