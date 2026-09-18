import { useEffect, useState } from "react";
import { plansApi, type TrainingPlan } from "../api/plans";

export function PlanView() {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    plansApi
      .current()
      .then(setPlan)
      .catch(() => setError("Impossible de charger le plan"))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      setPlan(await plansApi.generate());
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Impossible de générer le plan pour le moment");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Plan d'entraînement IA</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {generating ? "Génération..." : plan ? "Régénérer" : "Générer un plan"}
        </button>
      </div>

      {loading && <p className="text-gray-600 dark:text-gray-400">Chargement...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !plan && !error && (
        <p className="text-gray-600 dark:text-gray-400">
          Aucun plan pour l'instant. Ajoute quelques sorties dans ton journal puis génère un plan adapté à ton
          objectif.
        </p>
      )}

      {plan && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Objectif : {plan.goal ?? "non défini"} · généré le {new Date(plan.generated_at).toLocaleDateString()}
          </p>
          {plan.weeks.map((week) => (
            <div key={week.week_number} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-lg font-semibold">
                Semaine {week.week_number} — {week.focus}
              </h2>
              <div className="flex flex-col gap-2">
                {week.sessions.map((session, i) => (
                  <div key={i} className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-900">
                    <p className="font-medium">
                      {session.day} — {session.type} ({session.intensity})
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {session.distance_km} km · {session.duration_min} min
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">{session.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
