import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { setLanguage } from "../i18n";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "fr";
  const next = lang === "fr" ? "en" : "fr";

  return (
    <button
      onClick={() => setLanguage(next)}
      aria-label="Changer de langue"
      className={`btn-icon text-xs font-semibold uppercase ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={lang}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="grid place-items-center"
        >
          {lang}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
