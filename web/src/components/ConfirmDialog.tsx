import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div
                className={`mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full ${
                  variant === "danger"
                    ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                    : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                }`}
              >
                <AlertTriangle size={22} />
              </div>
              <h2 className="text-lg font-bold">{title}</h2>
              {description && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
              <div className="mt-6 flex gap-2">
                <button onClick={onCancel} className="btn-secondary flex-1">
                  {cancelLabel ?? t("common.cancel")}
                </button>
                <button
                  onClick={onConfirm}
                  className={
                    variant === "danger"
                      ? "inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 transition-all hover:bg-red-700 active:scale-[0.97]"
                      : "btn-primary flex-1"
                  }
                >
                  {confirmLabel ?? t("common.confirm")}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
