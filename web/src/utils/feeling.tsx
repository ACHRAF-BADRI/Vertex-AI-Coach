import { Flame, Frown, Meh, Smile } from "lucide-react";

export const FEELING_ICON: Record<string, { icon: typeof Frown; className: string }> = {
  difficile: { icon: Frown, className: "text-red-500" },
  moyen: { icon: Meh, className: "text-amber-500" },
  bien: { icon: Smile, className: "text-green-500" },
  excellent: { icon: Flame, className: "text-orange-500" },
};
