import { Check, Inbox, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { gymApi, type SharedGymPlan } from "../api/gym";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { Modal } from "../components/Modal";

export function GymInbox() {
  const { t, i18n } = useTranslation();
  const [shares, setShares] = useState<SharedGymPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{
    shareId: string;
    message: string;
    savedPlans: { id: string; name: string }[];
  } | null>(null);

  useEffect(() => {
    gymApi
      .listInbox()
      .then(setShares)
      .catch(() => setError(t("gymInbox.loadError")))
      .finally(() => setLoading(false));
  }, []);

  const handleAccept = async (share: SharedGymPlan) => {
    setAcceptingId(share.id);
    try {
      await gymApi.acceptShare(share.id);
      setShares((prev) => prev.filter((s) => s.id !== share.id));
      toast.success(t("gymInbox.acceptedToast"));
    } catch (err: any) {
      const data = err.response?.data;
      if (err.response?.status === 409 && data?.code === "limit_reached") {
        setConflict({ shareId: share.id, message: data.error, savedPlans: data.saved_plans ?? [] });
      } else {
        toast.error(data?.error ?? t("common.genericError"));
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleResolveConflict = async (replaceId: string) => {
    if (!conflict) return;
    setAcceptingId(conflict.shareId);
    try {
      await gymApi.acceptShare(conflict.shareId, replaceId);
      setShares((prev) => prev.filter((s) => s.id !== conflict.shareId));
      toast.success(t("gymInbox.acceptedToast"));
      setConflict(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (share: SharedGymPlan) => {
    setDecliningId(share.id);
    try {
      await gymApi.declineShare(share.id);
      setShares((prev) => prev.filter((s) => s.id !== share.id));
      toast.success(t("gymInbox.declinedToast"));
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setDecliningId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display mb-6 text-2xl font-bold tracking-tight">{t("gymInbox.title")}</h1>

      {loading && <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && shares.length === 0 && (
        <EmptyState
          icon={<Inbox size={28} />}
          title={t("gymInbox.emptyTitle")}
          description={t("gymInbox.emptyDescription")}
        />
      )}

      <div className="flex flex-col gap-3">
        {shares.map((share) => (
          <div
            key={share.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="min-w-0">
              <p className="font-semibold">{share.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("gymInbox.from", { name: share.sender_name })} ·{" "}
                {new Date(share.created_at).toLocaleDateString(i18n.language === "en" ? "en-US" : "fr-FR")}
              </p>
              {share.goal && (
                <div className="mt-1.5">
                  <Badge variant="blue">{share.goal}</Badge>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(share)}
                disabled={acceptingId === share.id || decliningId === share.id}
                className="btn-primary !px-3 !py-1.5 !text-xs disabled:pointer-events-none disabled:opacity-60"
              >
                {acceptingId === share.id ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Check size={14} />
                )}
                {t("gymInbox.accept")}
              </button>
              <button
                onClick={() => handleDecline(share)}
                disabled={acceptingId === share.id || decliningId === share.id}
                aria-label={t("gymInbox.decline")}
                title={t("gymInbox.decline")}
                className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 disabled:pointer-events-none disabled:opacity-60 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={conflict !== null} onClose={() => setConflict(null)} title={t("gymInbox.conflictTitle")}>
        {conflict && (
          <div className="flex flex-col gap-3">
            <Alert variant="info">{conflict.message}</Alert>
            <div className="flex flex-col gap-2">
              {conflict.savedPlans.map((saved) => (
                <div
                  key={saved.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 text-sm dark:bg-gray-950/60"
                >
                  <span className="min-w-0 truncate font-medium">{saved.name}</span>
                  <button
                    onClick={() => handleResolveConflict(saved.id)}
                    disabled={acceptingId !== null}
                    className="btn-secondary !px-3 !py-1.5 shrink-0 text-xs disabled:pointer-events-none disabled:opacity-60"
                  >
                    {t("gymPlanView.sendReplace")}
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setConflict(null)} className="btn-secondary">
              {t("common.cancel")}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
