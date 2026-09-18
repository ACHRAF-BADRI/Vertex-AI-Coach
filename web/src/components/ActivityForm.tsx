import { useState, type FormEvent } from "react";
import type { ActivityInput } from "../api/activities";

const FEELINGS = [
  { value: "difficile", label: "😞 Difficile" },
  { value: "moyen", label: "😐 Moyen" },
  { value: "bien", label: "🙂 Bien" },
  { value: "excellent", label: "💪 Excellent" },
];

interface ActivityFormProps {
  initialValues?: ActivityInput;
  submitLabel: string;
  onSubmit: (input: ActivityInput) => Promise<void>;
  onCancel?: () => void;
}

const emptyValues: ActivityInput = {
  date: new Date().toISOString().slice(0, 10),
  distance_km: 0,
  duration_min: 0,
  feeling: "",
  notes: "",
};

export function ActivityForm({ initialValues, submitLabel, onSubmit, onCancel }: ActivityFormProps) {
  const [values, setValues] = useState<ActivityInput>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err: any) {
      setError(err.response?.data?.error === "validation" ? "Merci de vérifier les champs" : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <input
        type="date"
        value={values.date}
        onChange={(e) => setValues({ ...values, date: e.target.value })}
        required
        className="col-span-2 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 sm:col-span-1"
      />
      <input
        type="number"
        step="0.01"
        min="0.01"
        placeholder="Distance (km)"
        value={values.distance_km || ""}
        onChange={(e) => setValues({ ...values, distance_km: Number(e.target.value) })}
        required
        className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
      />
      <input
        type="number"
        step="0.1"
        min="0.1"
        placeholder="Durée (min)"
        value={values.duration_min || ""}
        onChange={(e) => setValues({ ...values, duration_min: Number(e.target.value) })}
        required
        className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
      />
      <select
        value={values.feeling}
        onChange={(e) => setValues({ ...values, feeling: e.target.value })}
        className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
      >
        <option value="">Ressenti</option>
        {FEELINGS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Notes (optionnel)"
        value={values.notes}
        onChange={(e) => setValues({ ...values, notes: e.target.value })}
        className="col-span-2 rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 sm:col-span-4"
      />

      {error && <p className="col-span-2 text-sm text-red-600 sm:col-span-4">{error}</p>}

      <div className="col-span-2 flex gap-2 sm:col-span-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? "..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
