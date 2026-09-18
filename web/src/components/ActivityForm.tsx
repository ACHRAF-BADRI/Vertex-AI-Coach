import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ActivityInput } from "../api/activities";

const FEELINGS = ["difficile", "moyen", "bien", "excellent"];

const inputClass =
  "rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-blue-500";

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
  const { t } = useTranslation();
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
      setError(
        err.response?.data?.error === "validation" ? t("activityForm.validationError") : t("common.genericError"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <input
        type="date"
        value={values.date}
        onChange={(e) => setValues({ ...values, date: e.target.value })}
        required
        className={`col-span-2 sm:col-span-1 ${inputClass}`}
      />
      <input
        type="number"
        step="1"
        min="0"
        placeholder={t("activityForm.distance")}
        value={values.distance_km || ""}
        onChange={(e) => setValues({ ...values, distance_km: Number(e.target.value) })}
        required
        className={inputClass}
      />
      <input
        type="number"
        step="1"
        min="0"
        placeholder={t("activityForm.duration")}
        value={values.duration_min || ""}
        onChange={(e) => setValues({ ...values, duration_min: Number(e.target.value) })}
        required
        className={inputClass}
      />
      <select value={values.feeling} onChange={(e) => setValues({ ...values, feeling: e.target.value })} className={inputClass}>
        <option value="">{t("activityForm.feeling")}</option>
        {FEELINGS.map((f) => (
          <option key={f} value={f}>
            {t(`feeling.${f}`)}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder={t("activityForm.notes")}
        value={values.notes}
        onChange={(e) => setValues({ ...values, notes: e.target.value })}
        className={`col-span-2 sm:col-span-4 ${inputClass}`}
      />

      {error && <p className="col-span-2 text-sm text-red-600 sm:col-span-4">{error}</p>}

      <div className="col-span-2 flex gap-2 sm:col-span-4">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            {t("common.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
