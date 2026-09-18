import { useEffect, useState } from "react";
import { activitiesApi, type Activity, type ActivityInput } from "../api/activities";
import { ActivityForm } from "../components/ActivityForm";

const FEELING_EMOJI: Record<string, string> = {
  difficile: "😞",
  moyen: "😐",
  bien: "🙂",
  excellent: "💪",
};

export function TrainingLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadActivities = async () => {
    setLoading(true);
    try {
      setActivities(await activitiesApi.list());
      setError(null);
    } catch {
      setError("Impossible de charger le journal d'entraînement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleCreate = async (input: ActivityInput) => {
    const created = await activitiesApi.create(input);
    setActivities((prev) => [created, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setShowAddForm(false);
  };

  const handleUpdate = async (id: string, input: ActivityInput) => {
    const updated = await activitiesApi.update(id, input);
    setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette sortie ?")) return;
    await activitiesApi.remove(id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Journal d'entraînement</h1>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Ajouter une sortie
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <ActivityForm submitLabel="Ajouter" onSubmit={handleCreate} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {loading && <p className="text-gray-600 dark:text-gray-400">Chargement...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && activities.length === 0 && (
        <p className="text-gray-600 dark:text-gray-400">Aucune sortie enregistrée pour l'instant.</p>
      )}

      <div className="flex flex-col gap-3">
        {activities.map((activity) =>
          editingId === activity.id ? (
            <div key={activity.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <ActivityForm
                initialValues={{
                  date: activity.date,
                  distance_km: activity.distance_km,
                  duration_min: activity.duration_min,
                  feeling: activity.feeling ?? "",
                  notes: activity.notes ?? "",
                }}
                submitLabel="Enregistrer"
                onSubmit={(input) => handleUpdate(activity.id, input)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              key={activity.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
            >
              <div>
                <p className="font-medium">
                  {activity.date} — {activity.distance_km} km en {activity.duration_min} min
                  {activity.feeling && <span className="ml-2">{FEELING_EMOJI[activity.feeling]}</span>}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Allure : {activity.pace ? `${activity.pace} min/km` : "—"}
                  {activity.notes && <span className="ml-2">· {activity.notes}</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingId(activity.id)}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(activity.id)}
                  className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
