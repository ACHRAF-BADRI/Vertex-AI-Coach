import { AnimatePresence, motion } from "framer-motion";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";

interface GeneratingOverlayProps {
  open: boolean;
  title: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

export function GeneratingOverlay({ open, title, icon: Icon }: GeneratingOverlayProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="flex w-full max-w-xs flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-8 text-center shadow-2xl dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="relative grid h-28 w-28 place-items-center">
              <motion.span
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600/25 to-cyan-400/25 blur-md"
                animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.span
                className="absolute inset-1 rounded-full border-2 border-dashed border-blue-500/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
              />
              <motion.span
                className="absolute inset-3 rounded-full border-2 border-transparent border-t-blue-600 border-r-cyan-400"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              />
              <motion.span
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              >
                <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
              </motion.span>
              <motion.span
                className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/30"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Icon size={26} strokeWidth={2} />
              </motion.span>
            </div>

            <p className="font-display mt-6 text-base font-bold tracking-tight">{title}</p>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{t("common.generatingHint")}</p>

            <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <motion.div
                className="h-full w-2/5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                animate={{ x: ["-100%", "250%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
