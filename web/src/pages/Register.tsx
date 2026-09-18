import { motion } from "framer-motion";
import { Mail, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LanguageToggle } from "../components/LanguageToggle";
import { PasswordInput } from "../components/PasswordInput";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

const GOALS = ["5km", "10km", "semi-marathon", "marathon"];

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-blue-500";

export function Register() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [goal, setGoal] = useState(GOALS[1]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, name, goal);
      toast.success(t("register.welcomeToast"));
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-y-auto px-4 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,theme(colors.blue.100),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,theme(colors.blue.950),transparent_60%)]" />

      <div className="fixed right-0 top-0 z-50 flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white/90 p-8 shadow-xl shadow-gray-200/50 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/90 dark:shadow-none"
      >
        <h1 className="font-display bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-2xl font-bold uppercase tracking-wide text-transparent">
          {t("register.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("register.subtitle")}</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("register.name")}
            </label>
            <div className="relative">
              <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t("register.namePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("auth.email")}
            </label>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("auth.password")}
            </label>
            <PasswordInput
              placeholder={t("register.passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("register.goal")}
            </label>
            <select value={goal} onChange={(e) => setGoal(e.target.value)} className={inputClass}>
              {GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400"
            >
              {error}
            </motion.p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full">
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {submitting ? t("register.submitting") : t("register.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("register.haveAccount")}{" "}
          <Link to="/login" className="link-underline font-medium text-blue-600 dark:text-blue-400">
            {t("register.login")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
