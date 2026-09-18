import { MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../components/EmptyState";

export function StepsComingSoon() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display mb-6 text-2xl font-bold tracking-tight">{t("stepsComingSoon.title")}</h1>
      <EmptyState
        icon={<MapPin size={28} />}
        title={t("stepsComingSoon.comingSoonTitle")}
        description={t("stepsComingSoon.description")}
      />
    </div>
  );
}
