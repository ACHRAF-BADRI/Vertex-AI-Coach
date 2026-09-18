import { Dumbbell } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { gymApi } from "../api/gym";

const GOALS = [
  { value: "Prise de muscle", key: "muscleGain" },
  { value: "Perte de poids", key: "weightLoss" },
  { value: "Force", key: "strength" },
  { value: "Forme générale", key: "generalFitness" },
] as const;
const LEVELS = [
  { value: "Débutant", key: "beginner" },
  { value: "Intermédiaire", key: "intermediate" },
  { value: "Avancé", key: "advanced" },
] as const;
const EQUIPMENT = [
  { value: "Salle complète", key: "fullGym" },
  { value: "Haltères à la maison", key: "homeWeights" },
  { value: "Poids du corps uniquement", key: "bodyweightOnly" },
] as const;

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-blue-500";

export function GymProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [goal, setGoal] = useState<string>(GOALS[0].value);
  const [level, setLevel] = useState<string>(LEVELS[0].value);
  const [equipment, setEquipment] = useState<string>(EQUIPMENT[0].value);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    gymApi
      .getProfile()
      .then((profile) => {
        if (profile) {
          setGoal(profile.goal);
          setLevel(profile.level);
          setEquipment(profile.equipment);
          setDietaryNotes(profile.dietary_notes ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await gymApi.updateProfile({ goal, level, equipment, dietary_notes: dietaryNotes || undefined });
      toast.success(t("gymProfile.savedToast"));
      navigate("/gym/plan");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("gymProfile.saveErrorDefault"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display mb-6 text-2xl font-bold tracking-tight">{t("gymProfile.title")}</h1>

      {loading ? (
        <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <Dumbbell size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold">{t("gymProfile.infoTitle")}</h2>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("gymProfile.goal")}
              </label>
              <select value={goal} onChange={(e) => setGoal(e.target.value)} className={inputClass}>
                {GOALS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {t(`gymProfile.goals.${g.key}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("gymProfile.level")}
              </label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass}>
                {LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {t(`gymProfile.levels.${l.key}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("gymProfile.equipment")}
              </label>
              <select value={equipment} onChange={(e) => setEquipment(e.target.value)} className={inputClass}>
                {EQUIPMENT.map((eq) => (
                  <option key={eq.value} value={eq.value}>
                    {t(`gymProfile.equipments.${eq.key}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("gymProfile.dietaryNotes")}
              </label>
              <input
                type="text"
                placeholder={t("gymProfile.dietaryPlaceholder")}
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                className={inputClass}
              />
            </div>
            <button type="submit" disabled={saving} className="btn-primary self-start">
              {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {t("gymProfile.save")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
