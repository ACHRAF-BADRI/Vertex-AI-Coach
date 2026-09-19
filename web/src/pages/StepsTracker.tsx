import { Flame, Footprints, MapPin, Pause, Play, Square, Timer, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { stepsApi, type StepSession } from "../api/steps";
import { Alert } from "../components/Alert";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EmptyState } from "../components/EmptyState";
import { PathPreview } from "../components/PathPreview";
import { StatTile } from "../components/StatTile";
import { useAuth } from "../context/AuthContext";

type Status = "idle" | "running" | "paused";

const MAX_ACCURACY_M = 30;
const MIN_STEP_M = 3;
const MAX_SPEED_MS = 12;

function haversineM(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function formatDuration(totalSec: number) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function estimateSteps(distanceKm: number, durationSec: number, heightCm: number) {
  const speedKmh = durationSec ? distanceKm / (durationSec / 3600) : 0;
  const factor = speedKmh >= 7.5 ? 1.14 : 0.415;
  return Math.round((distanceKm * 1000) / ((heightCm / 100) * factor));
}

type WakeLockSentinelLike = { release: () => Promise<void> };
type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
};

export function StepsTracker() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const locale = i18n.language === "en" ? "en-US" : "fr-FR";

  const [status, setStatus] = useState<Status>("idle");
  const [path, setPath] = useState<[number, number][]>([]);
  const [distanceM, setDistanceM] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<StepSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<StepSession | null>(null);

  const watchId = useRef<number | null>(null);
  const lastPoint = useRef<[number, number] | null>(null);
  const lastTime = useRef<number>(0);
  const startedAt = useRef<Date | null>(null);
  const wakeLock = useRef<WakeLockSentinelLike | null>(null);

  const heightCm = user?.height_cm || 170;
  const distanceKm = distanceM / 1000;

  useEffect(() => {
    stepsApi
      .list()
      .then(setSessions)
      .catch(() => toast.error(t("stepsTracker.loadError")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
  }, []);

  useEffect(() => stopWatching, [stopWatching]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && status === "running" && !wakeLock.current) {
        (navigator as NavigatorWithWakeLock).wakeLock
          ?.request("screen")
          .then((lock) => {
            wakeLock.current = lock;
          })
          .catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [status]);

  const onPosition = (pos: GeolocationPosition) => {
    if (pos.coords.accuracy > MAX_ACCURACY_M) return;
    const point: [number, number] = [pos.coords.latitude, pos.coords.longitude];
    const now = pos.timestamp;
    const last = lastPoint.current;
    if (!last) {
      lastPoint.current = point;
      lastTime.current = now;
      setPath((p) => [...p, point]);
      return;
    }
    const d = haversineM(last, point);
    const dt = Math.max((now - lastTime.current) / 1000, 0.001);
    if (d < MIN_STEP_M || d / dt > MAX_SPEED_MS) return;
    lastPoint.current = point;
    lastTime.current = now;
    setDistanceM((m) => m + d);
    setPath((p) => [...p, point]);
  };

  const beginWatching = () => {
    watchId.current = navigator.geolocation.watchPosition(
      onPosition,
      (err) =>
        setGpsError(err.code === err.PERMISSION_DENIED ? t("stepsTracker.permissionDenied") : t("stepsTracker.gpsError")),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
    (navigator as NavigatorWithWakeLock).wakeLock
      ?.request("screen")
      .then((lock) => {
        wakeLock.current = lock;
      })
      .catch(() => {});
  };

  const handleStart = () => {
    if (!("geolocation" in navigator)) {
      setGpsError(t("stepsTracker.unsupported"));
      return;
    }
    setGpsError(null);
    setPath([]);
    setDistanceM(0);
    setElapsedSec(0);
    lastPoint.current = null;
    startedAt.current = new Date();
    setStatus("running");
    beginWatching();
  };

  const handlePause = () => {
    stopWatching();
    lastPoint.current = null;
    setStatus("paused");
  };

  const handleResume = () => {
    setGpsError(null);
    setStatus("running");
    beginWatching();
  };

  const handleStop = async () => {
    stopWatching();
    setStatus("idle");
    const session = {
      started_at: (startedAt.current ?? new Date()).toISOString(),
      distance_km: distanceKm,
      duration_sec: elapsedSec,
      path,
    };
    setPath([]);
    setDistanceM(0);
    setElapsedSec(0);
    lastPoint.current = null;
    if (session.distance_km < 0.01 || session.duration_sec < 5) {
      toast.error(t("stepsTracker.tooShort"));
      return;
    }
    setSaving(true);
    try {
      const created = await stepsApi.create(session);
      setSessions((prev) => [created, ...prev]);
      toast.success(t("stepsTracker.savedToast"));
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await stepsApi.remove(deleteTarget.id);
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success(t("stepsTracker.deletedToast"));
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("common.genericError"));
    } finally {
      setDeleteTarget(null);
    }
  };

  const liveSteps = estimateSteps(distanceKm, elapsedSec, heightCm);
  const totalSteps = sessions.reduce((sum, s) => sum + s.steps, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-8 pt-4 sm:pt-8">
      <h1 className="font-display mb-6 text-2xl font-bold tracking-tight">{t("stepsTracker.title")}</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center">
          <p className="font-display text-5xl font-bold tabular-nums tracking-tight sm:text-6xl">
            {distanceKm.toFixed(2)}
            <span className="ml-1.5 text-xl font-semibold text-gray-400 dark:text-gray-500">km</span>
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-blue-600 dark:text-blue-400">
            {formatDuration(elapsedSec)}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatTile label={t("stepsTracker.steps")} value={liveSteps.toLocaleString(locale)} />
          <StatTile
            label={t("stepsTracker.speed")}
            value={`${(elapsedSec ? distanceKm / (elapsedSec / 3600) : 0).toFixed(1)} km/h`}
          />
        </div>

        {path.length >= 2 && <PathPreview path={path} className="mt-4" />}

        {gpsError && (
          <div className="mt-4">
            <Alert variant="error">{gpsError}</Alert>
          </div>
        )}
        {status === "running" && path.length === 0 && !gpsError && (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t("stepsTracker.waitingGps")}</p>
        )}

        <div className="sticky bottom-3 z-10 mx-auto mt-5 flex w-fit max-w-full justify-center gap-3 rounded-full bg-white/80 p-1.5 backdrop-blur-md dark:bg-gray-900/80 sm:static sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          {status === "idle" && (
            <button onClick={handleStart} aria-label={t("stepsTracker.start")} title={t("stepsTracker.start")} disabled={saving} className="btn-primary h-14 w-14 !p-0 sm:h-auto sm:w-auto sm:min-w-[9.5rem] sm:!px-5 sm:!py-3.5 sm:!text-base">
              <Play size={22} />
              <span className="hidden sm:inline">{t("stepsTracker.start")}</span>
            </button>
          )}
          {status === "running" && (
            <button onClick={handlePause} aria-label={t("stepsTracker.pause")} title={t("stepsTracker.pause")} className="btn-secondary h-14 w-14 !p-0 sm:h-auto sm:w-auto sm:min-w-[9.5rem] sm:!px-5 sm:!py-3.5 sm:!text-base">
              <Pause size={22} />
              <span className="hidden sm:inline">{t("stepsTracker.pause")}</span>
            </button>
          )}
          {status === "paused" && (
            <button onClick={handleResume} aria-label={t("stepsTracker.resume")} title={t("stepsTracker.resume")} className="btn-primary h-14 w-14 !p-0 sm:h-auto sm:w-auto sm:min-w-[9.5rem] sm:!px-5 sm:!py-3.5 sm:!text-base">
              <Play size={22} />
              <span className="hidden sm:inline">{t("stepsTracker.resume")}</span>
            </button>
          )}
          {status !== "idle" && (
            <button
              onClick={handleStop} aria-label={t("stepsTracker.stop")} title={t("stepsTracker.stop")}
              className="inline-flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-red-600 p-0 text-base sm:h-auto sm:w-auto sm:min-w-[9.5rem] sm:px-5 sm:py-3.5 font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.97]"
            >
              <Square size={22} />
              <span className="hidden sm:inline">{t("stepsTracker.stop")}</span>
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">{t("stepsTracker.hint")}</p>
      </div>

      <div className="mb-3 mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("stepsTracker.history")}</h2>
        {sessions.length > 0 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {t("stepsTracker.totalSteps", { count: totalSteps.toLocaleString(locale) })}
          </span>
        )}
      </div>

      {loading && <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>}
      {!loading && sessions.length === 0 && (
        <EmptyState
          icon={<MapPin size={28} />}
          title={t("stepsTracker.emptyTitle")}
          description={t("stepsTracker.emptyDescription")}
        />
      )}

      <div className="flex flex-col gap-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {new Date(s.started_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
              </p>
              <button
                onClick={() => setDeleteTarget(s)}
                aria-label={t("common.delete")}
                className="grid h-8 w-8 place-items-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} /> {s.distance_km.toFixed(2)} km
              </span>
              <span className="inline-flex items-center gap-1">
                <Timer size={13} /> {formatDuration(s.duration_sec)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Footprints size={13} /> {s.steps.toLocaleString(locale)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Flame size={13} /> {s.calories} kcal
              </span>
            </div>
            {s.path.length >= 2 && <PathPreview path={s.path} className="mt-3" />}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("stepsTracker.confirmDeleteTitle")}
        description={t("common.irreversible")}
        confirmLabel={t("common.delete")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
