import { useAuth } from "../context/AuthContext";

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Bonjour {user?.name} 👋</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Objectif actuel : {user?.goal ?? "non défini"}. Les statistiques d'entraînement arrivent bientôt.
      </p>
    </div>
  );
}
