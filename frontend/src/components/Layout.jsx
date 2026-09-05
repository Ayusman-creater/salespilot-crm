import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard, Users2, Building2, Handshake, ListChecks, Bell, LogOut, ShieldCheck,
  Search, Plus, Menu, X,
} from "lucide-react";
import toast from "react-hot-toast";
import { selectCurrentUser, clearCredentials } from "../features/auth/authSlice";
import { useLogoutMutation } from "../features/auth/authApi";
import { useGetNotificationsQuery } from "../features/notifications/notificationsApi";
import { apiSlice } from "../features/api/apiSlice";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["Admin", "Sales Manager", "Sales Executive"] },
  { to: "/leads", label: "Leads", icon: Users2, roles: ["Admin", "Sales Manager", "Sales Executive"] },
  { to: "/customers", label: "Customers", icon: Building2, roles: ["Admin", "Sales Manager", "Sales Executive"] },
  { to: "/deals", label: "Deals", icon: Handshake, roles: ["Admin", "Sales Manager", "Sales Executive"] },
  { to: "/activities", label: "Activities", icon: ListChecks, roles: ["Admin", "Sales Manager", "Sales Executive"] },
  { to: "/users", label: "Users", icon: ShieldCheck, roles: ["Admin"] },
];

const navLinkClasses = ({ isActive }) =>
  `flex items-center gap-3 pl-3 pr-3 py-2.5 border-l-2 text-base font-medium transition-colors shrink-0 ${
    isActive
      ? "border-indigo-500 bg-ink-800 text-white"
      : "border-transparent text-slate-400 hover:bg-ink-800 hover:text-white"
  }`;

const Wordmark = ({ size = "text-2xl", light = false }) => (
  <span className={`font-heading font-bold ${size}`}>
    <span className={light ? "text-white" : "text-ink-900"}>Sales</span>
    <span className="text-indigo-600">Pilot</span>
  </span>
);

const getInitials = (name = "") =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

// TopBar takes a menuButton slot so the hamburger only renders on mobile,
// injected by Layout rather than duplicated here.
const TopBar = ({ user, unreadCount, onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden shrink-0 w-9 h-9 flex items-center justify-center border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50"
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>

        <div className="relative flex-1 min-w-0 max-w-md">
          <Search size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search…"
            className="w-full pl-9 pr-3 sm:pr-14 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 outline-none transition-colors"
          />
          <kbd className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          <button
            onClick={() => navigate("/leads?new=1")}
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md px-2.5 sm:px-3 py-2 transition-colors"
          >
            <Plus size={16} strokeWidth={2} />
            <span className="hidden sm:inline">New Lead</span>
          </button>

          <button
            onClick={() => navigate("/notifications")}
            className="relative w-9 h-9 flex items-center justify-center border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 transition-colors shrink-0"
          >
            <Bell size={17} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-2.5 pl-1">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutApi] = useLogoutMutation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifData } = useGetNotificationsQuery(undefined, {
    pollingInterval: 60000,
    skip: !user,
  });

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {}
    dispatch(clearCredentials());
    dispatch(apiSlice.util.resetApiState());
    toast.success("Logged out");
    navigate("/login");
  };

  const visibleNav = navItems.filter((item) => item.roles.includes(user?.role));
  const unreadCount = notifData?.unreadCount || 0;

  // Close the mobile drawer automatically whenever the route changes,
  // so tapping a nav link doesn't leave the overlay open behind the new page.
  const handleNavClick = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Mobile overlay backdrop — only rendered/visible when drawer is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: fixed panel on desktop (lg+), slide-in drawer on mobile.
          Translated off-screen by default on mobile, slides in via `sidebarOpen`. */}
      <aside
        className={`w-64 bg-ink-900 text-slate-200 flex flex-col shrink-0 h-screen fixed lg:sticky top-0 z-50 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-800 shrink-0">
          <div>
            <Wordmark light size="text-xl" />
            <p className="text-xs text-slate-500 mt-1">{user?.role}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto py-4 space-y-0.5 sidebar-scroll">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navLinkClasses} onClick={handleNavClick}>
              <Icon size={20} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}

          <NavLink
            to="/notifications"
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center justify-between pl-3 pr-3 py-2.5 border-l-2 text-base font-medium transition-colors shrink-0 ${
                isActive
                  ? "border-indigo-500 bg-ink-800 text-white"
                  : "border-transparent text-slate-400 hover:bg-ink-800 hover:text-white"
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Bell size={20} strokeWidth={1.75} />
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </NavLink>
        </nav>

        <div className="shrink-0 py-2 border-t border-ink-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 pl-3 pr-3 py-2.5 border-l-2 border-transparent text-base font-medium text-slate-400 hover:bg-ink-800 hover:text-white transition-colors"
          >
            <LogOut size={20} strokeWidth={1.75} />
            Log out
          </button>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-ink-800">
          <p className="text-sm font-medium text-white truncate">{user?.name}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>
      </aside>

      {/* lg:ml-64 reserves the sidebar's width on desktop, since the sidebar
          is `fixed` there too (simpler than juggling sticky positioning
          across two different layout modes). */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} unreadCount={unreadCount} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;