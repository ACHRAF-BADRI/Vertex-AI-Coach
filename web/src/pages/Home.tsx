import { motion } from "framer-motion";
import { ChevronRight, Dumbbell, Footprints, MapPin } from "lucide-react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface HomeCard {
  to: string;
  icon: ComponentType<{ size?: number }>;
  title: string;
  description: string;
}

export function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const cards: HomeCard[] = [
    { to: "/gym/plan", icon: Dumbbell, title: t("sidebar.gym"), description: t("home.gymDescription") },
    { to: "/steps", icon: MapPin, title: t("sidebar.steps"), description: t("home.stepsDescription") },
    { to: "/dashboard", icon: Footprints, title: t("sidebar.running"), description: t("home.runningDescription") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        {t("dashboard.greeting", { name: user?.name })}
      </h1>
      <p className="mt-1 text-gray-500 dark:text-gray-400">{t("home.subtitle")}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
            >
              <Link
                to={card.to}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-900"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-600/10 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/15 dark:text-blue-400">
                  <Icon size={22} />
                </div>
                <h2 className="flex items-center gap-1 text-lg font-semibold">
                  {card.title}
                  <ChevronRight
                    size={16}
                    className="text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  />
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.description}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
