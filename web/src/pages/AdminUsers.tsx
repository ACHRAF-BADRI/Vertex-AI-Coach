import { Eye, Pencil, Plus, RefreshCw, Search, ShieldOff, Trash2, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { adminApi, type UserInput } from "../api/admin";
import { AdminStatsPanel } from "../components/AdminStatsPanel";
import { Alert } from "../components/Alert";
import { Badge } from "../components/Badge";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { UserFormModal } from "../components/UserFormModal";
import { UserProgressModal } from "../components/UserProgressModal";
import { useAuth, type User } from "../context/AuthContext";

const LIMIT = 10;

export function AdminUsers() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [progressUser, setProgressUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter]);

  useEffect(() => {
    setLoading(true);
    adminApi
      .listUsers({ page, limit: LIMIT, search: debouncedSearch || undefined, role: roleFilter || undefined })
      .then((res) => {
        setUsers(res.users);
        setTotal(res.total);
        setError(null);
      })
      .catch(() => setError(t("adminUsers.loadError")))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, roleFilter]);

  const reload = () => {
    return adminApi
      .listUsers({ page, limit: LIMIT, search: debouncedSearch || undefined, role: roleFilter || undefined })
      .then((res) => {
        setUsers(res.users);
        setTotal(res.total);
      });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshKey((k) => k + 1);
    setRefreshing(false);
    toast.success(t("adminUsers.refreshedToast"));
  };

  const handleCreate = async (input: UserInput) => {
    await adminApi.createUser(input);
    toast.success(t("adminUsers.createdToast"));
    reload();
  };

  const handleUpdate = async (input: UserInput) => {
    if (!editingUser) return;
    await adminApi.updateUser(editingUser.id, input);
    toast.success(t("adminUsers.updatedToast"));
    reload();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteUser(deleteTarget.id);
      toast.success(t("adminUsers.deletedToast"));
      reload();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("adminUsers.deleteErrorDefault"));
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleSuspend = async (u: User) => {
    const nextStatus = u.status === "suspended" ? "active" : "suspended";
    try {
      await adminApi.updateUser(u.id, { status: nextStatus });
      toast.success(
        nextStatus === "suspended"
          ? t("adminUsers.suspendedToast", { name: u.name })
          : t("adminUsers.reactivatedToast", { name: u.name }),
      );
      reload();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? t("adminUsers.actionErrorDefault"));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">{t("adminUsers.title")}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label={t("common.refresh")}
            className="grid h-9 w-9 place-items-center rounded-full bg-blue-600/10 text-blue-600 transition-colors hover:bg-blue-600/15 disabled:pointer-events-none disabled:opacity-60 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:bg-blue-500/20"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => {
              setEditingUser(undefined);
              setFormOpen(true);
            }}
            className="btn-primary"
          >
            <Plus size={16} />
            {t("adminUsers.newUser")}
          </button>
        </div>
      </div>

      <AdminStatsPanel refreshKey={refreshKey} />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder={t("adminUsers.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 dark:border-gray-700 dark:bg-gray-950"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950"
        >
          <option value="">{t("adminUsers.allRoles")}</option>
          <option value="user">{t("common.user")}</option>
          <option value="admin">{t("common.admin")}</option>
        </select>
      </div>

      {loading && <p className="text-gray-600 dark:text-gray-400">{t("common.loading")}</p>}
      {error && <Alert variant="error">{error}</Alert>}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-950/50 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">{t("adminUsers.colName")}</th>
                  <th className="hidden px-4 py-3 sm:table-cell">{t("adminUsers.colEmail")}</th>
                  <th className="hidden px-4 py-3 md:table-cell">{t("adminUsers.colGoal")}</th>
                  <th className="px-4 py-3">{t("adminUsers.colRole")}</th>
                  <th className="px-4 py-3">{t("adminUsers.colStatus")}</th>
                  <th className="px-4 py-3 text-right">{t("adminUsers.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                  >
                    <td className="px-4 py-3 font-medium">
                      <div className="max-w-[9rem] truncate sm:max-w-none">{u.name}</div>
                      <div className="truncate text-xs font-normal text-gray-500 dark:text-gray-400 sm:hidden">
                        {u.email}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 dark:text-gray-400 sm:table-cell">{u.email}</td>
                    <td className="hidden px-4 py-3 text-gray-500 dark:text-gray-400 md:table-cell">
                      {u.goal ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.role === "admin" ? "blue" : "gray"}>
                        {u.role === "admin" ? t("common.admin") : t("common.user")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={u.status === "suspended" ? "red" : "green"}>
                        {u.status === "suspended" ? t("adminUsers.statusSuspended") : t("adminUsers.statusActive")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setProgressUser(u)}
                          aria-label={t("adminUsers.viewProgress")}
                          className="btn-icon !h-8 !w-8"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setFormOpen(true);
                          }}
                          aria-label={t("adminUsers.edit")}
                          className="btn-icon !h-8 !w-8"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleSuspend(u)}
                          disabled={u.id === currentUser?.id}
                          aria-label={u.status === "suspended" ? t("adminUsers.reactivate") : t("adminUsers.suspend")}
                          title={u.status === "suspended" ? t("adminUsers.reactivate") : t("adminUsers.suspend")}
                          className="grid h-8 w-8 place-items-center rounded-full text-amber-600 transition-colors hover:bg-amber-50 disabled:pointer-events-none disabled:opacity-30 dark:text-amber-400 dark:hover:bg-amber-950"
                        >
                          {u.status === "suspended" ? <UserCheck size={14} /> : <ShieldOff size={14} />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          disabled={u.id === currentUser?.id}
                          aria-label={t("adminUsers.delete")}
                          className="grid h-8 w-8 place-items-center rounded-full text-red-600 transition-colors hover:bg-red-50 disabled:pointer-events-none disabled:opacity-30 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {t("adminUsers.noMatch")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span>{t("adminUsers.count", { count: total })}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary !px-3 !py-1.5 disabled:pointer-events-none disabled:opacity-40"
              >
                {t("common.previous")}
              </button>
              <span>{t("adminUsers.pageOf", { page, total: totalPages })}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary !px-3 !py-1.5 disabled:pointer-events-none disabled:opacity-40"
              >
                {t("common.next")}
              </button>
            </div>
          </div>
        </>
      )}

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={editingUser ? handleUpdate : handleCreate}
        initial={editingUser}
      />
      <UserProgressModal open={progressUser !== null} onClose={() => setProgressUser(null)} user={progressUser} />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("adminUsers.confirmDeleteTitle", { name: deleteTarget?.name })}
        description={t("adminUsers.confirmDeleteDescription")}
        confirmLabel={t("common.delete")}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
