import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/60 px-6 py-14 text-center dark:bg-gray-900/40">
      <div className="relative h-24 w-24 shrink-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/25 to-cyan-400/25 blur-lg" />
        <div className="absolute inset-3 rounded-full bg-gradient-to-br from-blue-500/15 to-cyan-400/15" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-16 w-16 rotate-3 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/25">
            {icon}
          </div>
        </div>
        <div className="absolute -right-0.5 top-1 h-3 w-3 rounded-full bg-cyan-400" />
        <div className="absolute bottom-1 left-0 h-2 w-2 rounded-full bg-blue-500" />
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
