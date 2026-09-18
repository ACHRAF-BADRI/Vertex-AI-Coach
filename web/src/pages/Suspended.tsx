import { motion } from "framer-motion";
import { Mail, ShieldOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { LanguageToggle } from "../components/LanguageToggle";
import { ThemeToggle } from "../components/ThemeToggle";

export function Suspended() {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-y-auto px-4 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,theme(colors.red.100),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,theme(colors.red.950),transparent_60%)]" />

      <div className="fixed right-0 top-0 z-50 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white/90 p-8 text-center shadow-xl shadow-gray-200/50 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90 dark:shadow-none"
      >
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <ShieldOff size={26} />
        </div>
        <h1 className="font-display text-xl font-bold">{t("suspended.title")}</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t("suspended.message")}</p>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Mail size={14} />
          {t("suspended.contact")}
        </p>
        <Link to="/login" className="btn-secondary mt-6 w-full">
          {t("suspended.backToLogin")}
        </Link>
      </motion.div>
    </div>
  );
}
