import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { UserInput } from "../api/admin";
import type { User } from "../context/AuthContext";
import { Modal } from "./Modal";
import { PasswordInput } from "./PasswordInput";

const GOALS = ["5km", "10km", "semi-marathon", "marathon"];

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-blue-500";

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: UserInput) => Promise<void>;
  initial?: User;
}

export function UserFormModal({ open, onClose, onSubmit, initial }: UserFormModalProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [goal, setGoal] = useState(GOALS[1]);
  const [gymSavedPlanLimit, setGymSavedPlanLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setEmail(initial?.email ?? "");
    setPassword("");
    setRole(initial?.role ?? "user");
    setGoal(initial?.goal ?? GOALS[1]);
    setGymSavedPlanLimit(initial?.gym_saved_plan_limit ? String(initial.gym_saved_plan_limit) : "");
  }, [open, initial]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const input: UserInput = {
        name,
        email,
        role,
        goal,
        gym_saved_plan_limit: gymSavedPlanLimit ? Number(gymSavedPlanLimit) : null,
      };
      if (!isEdit) input.password = password;
      await onSubmit(input);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? t("userFormModal.editTitle") : t("userFormModal.createTitle")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("userFormModal.name")}
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("userFormModal.email")}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        {!isEdit && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("userFormModal.password")}
            </label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("userFormModal.goal")}
          </label>
          <select value={goal} onChange={(e) => setGoal(e.target.value)} className={inputClass}>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("userFormModal.role")}
          </label>
          <select value={role} onChange={(e) => setRole(e.target.value as "user" | "admin")} className={inputClass}>
            <option value="user">{t("userFormModal.roleUser")}</option>
            <option value="admin">{t("userFormModal.roleAdmin")}</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("userFormModal.gymSavedPlanLimit")}
          </label>
          <input
            type="number"
            min={1}
            placeholder={t("userFormModal.gymSavedPlanLimitPlaceholder")}
            value={gymSavedPlanLimit}
            onChange={(e) => setGymSavedPlanLimit(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {isEdit ? t("userFormModal.save") : t("userFormModal.create")}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            {t("userFormModal.cancel")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
