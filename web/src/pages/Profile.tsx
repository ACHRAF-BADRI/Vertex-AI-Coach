import { KeyRound, User as UserIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PasswordInput } from "../components/PasswordInput";
import { useAuth } from "../context/AuthContext";

const GOALS = ["5km", "10km", "semi-marathon", "marathon"];

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-blue-500";

export function Profile() {
  const { t } = useTranslation();
  const { user, updateProfile, changePassword } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [goal, setGoal] = useState(user?.goal ?? GOALS[1]);
  const [weight, setWeight] = useState(user?.weight_kg ? String(user.weight_kg) : "");
  const [height, setHeight] = useState(user?.height_cm ? String(user.height_cm) : "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        name,
        goal,
        weight_kg: weight ? Number(weight) : undefined,
        height_cm: height ? Number(height) : undefined,
      });
      toast.success(t("profile.savedToast"));
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("profile.saveErrorDefault"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success(t("profile.passwordUpdatedToast"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("profile.passwordErrorDefault"));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display mb-6 text-2xl font-bold tracking-tight">{t("profile.title")}</h1>

      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <UserIcon size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold">{t("profile.infoTitle")}</h2>
          </div>
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("profile.name")}
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("profile.email")}
              </label>
              <input value={user?.email ?? ""} disabled className={`${inputClass} opacity-60`} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("profile.goal")}
              </label>
              <select value={goal ?? GOALS[1]} onChange={(e) => setGoal(e.target.value)} className={inputClass}>
                {GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("profile.weight")}
              </label>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="70"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("profile.weightHint")}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("profile.height")}
              </label>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="170"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("profile.heightHint")}</p>
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary self-start">
              {savingProfile && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {t("profile.save")}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold">{t("profile.passwordTitle")}</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("profile.currentPassword")}
              </label>
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("profile.newPassword")}
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("profile.confirmPassword")}
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>
            <button type="submit" disabled={savingPassword} className="btn-primary self-start">
              {savingPassword && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {t("profile.changePassword")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
