export function formatPace(pace: number | null): string {
  if (pace === null) return "—";
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
