import type { ReactNode } from "react";

interface BannerProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}

export function Banner({ icon, title, subtitle, action, children }: BannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/50 p-4 shadow-xl shadow-blue-600/5 backdrop-blur-xl dark:border-white/10 dark:bg-gray-900/40 sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-400/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-1/4 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 sm:items-start sm:gap-4">
          {icon && (
            <div className="hidden shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/25 sm:grid sm:h-12 sm:w-12">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-display truncate text-base font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
              {title}
            </h1>
            {subtitle && <p className="mt-1 hidden text-sm text-gray-600 dark:text-gray-300 sm:block">{subtitle}</p>}
            {children && <div className="mt-2 hidden flex-wrap items-center gap-2 sm:mt-3 sm:flex">{children}</div>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
