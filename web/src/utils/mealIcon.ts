import { Apple, Coffee, Moon, UtensilsCrossed, Zap, type LucideIcon } from "lucide-react";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function getMealIcon(text: string): LucideIcon {
  const normalized = normalize(text);

  if (normalized.includes("petit-dejeuner") || normalized.includes("petit dejeuner") || normalized.includes("breakfast")) {
    return Coffee;
  }
  if (normalized.includes("avant") || normalized.includes("pre-entrainement") || normalized.includes("pre-workout")) {
    return Zap;
  }
  if (normalized.includes("apres") || normalized.includes("post-entrainement") || normalized.includes("post-workout")) {
    return Zap;
  }
  if (normalized.includes("diner") || normalized.includes("dinner") || normalized.includes("souper")) {
    return Moon;
  }
  if (normalized.includes("collation") || normalized.includes("snack") || normalized.includes("gouter")) {
    return Apple;
  }
  return UtensilsCrossed;
}
