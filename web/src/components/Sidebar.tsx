import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ClipboardList,
  Dumbbell,
  Footprints,
  Inbox,
  Languages,
  LayoutDashboard,
  Library,
  LogOut,
  MapPin,
  Menu,
  Moon,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Badge } from "./Badge";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { setLanguage } from "../i18n";

function isLinkActive(pathname: string, to: string, end: boolean) {
  return end ? pathname === to : pathname.startsWith(to);
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const SECTIONS = [
    {
      key: "gym",
      label: t("sidebar.gym"),
      icon: Dumbbell,
      links: [
        { to: "/gym/profile", label: t("sidebar.gymProfileLink"), end: true, icon: UserCog },
        { to: "/gym/plan", label: t("sidebar.gymPlanLink"), end: true, icon: ClipboardList },
        { to: "/gym/saved", label: t("sidebar.gymSavedLink"), end: true, icon: Library },
        { to: "/gym/inbox", label: t("sidebar.gymInboxLink"), end: true, icon: Inbox },
      ],
    },
    {
      key: "steps",
      label: t("sidebar.steps"),
      icon: MapPin,
      links: [{ to: "/steps", label: t("sidebar.stepsLink"), end: true, icon: MapPin }],
    },
    {
      key: "running",
      label: t("sidebar.running"),
      icon: Footprints,
      links: [
        { to: "/dashboard", label: t("sidebar.dashboard"), end: true, icon: LayoutDashboard },
        { to: "/training-log", label: t("sidebar.journal"), end: false, icon: NotebookPen },
        { to: "/plan", label: t("sidebar.planIA"), end: false, icon: Sparkles },
      ],
    },
  ];
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("running");

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const active = SECTIONS.find((s) => s.links.some((l) => isLinkActive(location.pathname, l.to, l.end)));
    if (active) setOpenSection(active.key);
  }, [location.pathname]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/login");
  };

  const linkClass = (isActive: boolean, isCollapsed: boolean) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
        : "text-gray-600 hover:bg-blue-600/5 hover:text-blue-600 dark:text-gray-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-400"
    } ${isCollapsed ? "justify-center" : ""}`;

  const content = (isCollapsed: boolean, closeMobile?: () => void) => (
    <div className="flex h-full flex-col">
      <Link
        to="/"
        onClick={closeMobile}
        className={`flex h-16 items-center gap-2 px-4 ${isCollapsed ? "justify-center px-0" : ""}`}
      >
        <Footprints className="shrink-0 text-blue-600 dark:text-blue-400" size={24} />
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="font-display overflow-hidden whitespace-nowrap bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-base font-bold tracking-tight text-transparent"
            >
              {t("sidebar.appName")}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {SECTIONS.map((section) => {
          const SectionIcon = section.icon;
          const sectionHasActive = section.links.some((l) => isLinkActive(location.pathname, l.to, l.end));
          const isOpen = openSection === section.key;

          return (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => {
                  if (isCollapsed) {
                    navigate(section.links[0].to);
                    closeMobile?.();
                  } else {
                    setOpenSection((prev) => (prev === section.key ? null : section.key));
                  }
                }}
                title={isCollapsed ? section.label : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-blue-600/5 dark:hover:bg-blue-500/10 ${
                  sectionHasActive ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <SectionIcon size={18} className="shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{section.label}</span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </>
                )}
              </button>

              {!isCollapsed && (
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden pl-3"
                    >
                      <div className="flex flex-col gap-1 py-1">
                        {section.links.map((link) => {
                          const isActive = isLinkActive(location.pathname, link.to, link.end);
                          const Icon = link.icon;
                          return (
                            <NavLink
                              key={link.to}
                              to={link.to}
                              end={link.end}
                              onClick={closeMobile}
                              className={`${linkClass(isActive, false)} !py-2 text-[13px]`}
                            >
                              <Icon size={16} className="shrink-0" />
                              <span>{link.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}

        {user.role === "admin" && (
          <NavLink
            to="/admin/users"
            onClick={closeMobile}
            title={isCollapsed ? t("sidebar.admin") : undefined}
            className={linkClass(location.pathname.startsWith("/admin"), isCollapsed)}
          >
            <ShieldCheck size={18} className="shrink-0" />
            {!isCollapsed && <span>{t("sidebar.admin")}</span>}
          </NavLink>
        )}
      </nav>

      <div className="flex flex-col gap-1 border-t border-gray-100 p-3 dark:border-gray-800">
        <Link
          to="/profile"
          onClick={closeMobile}
          title={isCollapsed ? t("sidebar.account") : undefined}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-blue-600/5 dark:hover:bg-blue-500/10 ${isCollapsed ? "justify-center px-0" : ""}`}
        >
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600/10 text-sm font-semibold text-blue-600 dark:text-blue-400">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              {user.role === "admin" && (
                <Badge variant="blue" icon={<ShieldCheck size={11} />}>
                  {t("sidebar.admin")}
                </Badge>
              )}
            </div>
          )}
        </Link>

        <button
          onClick={() => setLanguage(i18n.language === "en" ? "fr" : "en")}
          className={linkClass(false, isCollapsed)}
          title={isCollapsed ? t("sidebar.theme") : undefined}
        >
          <Languages size={18} className="shrink-0" />
          {!isCollapsed && <span>{i18n.language === "en" ? "Français" : "English"}</span>}
        </button>

        <button onClick={toggleTheme} className={linkClass(false, isCollapsed)} title={isCollapsed ? t("sidebar.theme") : undefined}>
          {theme === "dark" ? <Sun size={18} className="shrink-0" /> : <Moon size={18} className="shrink-0" />}
          {!isCollapsed && <span>{theme === "dark" ? t("sidebar.lightMode") : t("sidebar.darkMode")}</span>}
        </button>

        <button
          onClick={handleLogout}
          className={linkClass(false, isCollapsed) + " hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/50 dark:hover:!text-red-400"}
          title={isCollapsed ? t("sidebar.logout") : undefined}
        >
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span>{t("sidebar.logout")}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-gray-800/80 dark:bg-gray-950/80 lg:hidden">
        <Link to="/" className="flex min-w-0 items-center gap-2 text-base font-bold tracking-tight">
          <Footprints className="shrink-0 text-blue-600 dark:text-blue-400" size={20} />
          <span className="font-display truncate bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {t("sidebar.appName")}
          </span>
        </Link>
        <button onClick={() => setMobileOpen(true)} aria-label={t("sidebar.openMenu")} className="btn-icon shrink-0">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 lg:hidden"
            >
              {content(false, () => setMobileOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 260 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="sticky top-0 hidden h-svh shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 lg:flex lg:flex-col"
      >
        {content(collapsed)}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? t("sidebar.openSidebar") : t("sidebar.collapseSidebar")}
          className="absolute -right-3 top-16 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>
      </motion.aside>
    </>
  );
}
