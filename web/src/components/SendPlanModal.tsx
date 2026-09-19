import { Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "./Modal";

export function SendPlanModal({
  open,
  sending,
  onSend,
  onClose,
}: {
  open: boolean;
  sending: boolean;
  onSend: (email: string, name: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) {
      setEmail("");
      setName("");
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title={t("gymPlanView.sendModalTitle")}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim() && name.trim()) onSend(email.trim(), name.trim());
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("gymPlanView.sendModalEmailLabel")}
          </label>
          <div className="relative">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              required
              autoFocus
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("gymPlanView.saveModalNameLabel")}
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("gymPlanView.saveModalNamePlaceholder")}
            required
            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-950 dark:focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={sending} className="btn-primary flex-1">
            {sending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {t("gymPlanView.sendModalConfirm")}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            {t("common.cancel")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
