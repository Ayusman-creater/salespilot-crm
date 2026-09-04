import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard, Users2, Building2, Handshake, ListChecks, Bell, LogOut, ShieldCheck,
  Search, Plus,
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

const TopBar = ({ user, unreadCount }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="flex items-center justify-between gap-4 px-6 py-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, customers, deals…"
            className="w-full pl-9 pr-14 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:border-indigo-500 outline-none transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate("/leads?new=1")}
            className="flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md px-3 py-2 transition-colors"
          >
            <Plus size={16} strokeWidth={2} />
            New Lead
          </button>

          <button
            onClick={() => navigate("/notifications")}
            className="relative w-9 h-9 flex items-center justify-center border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Bell size={17} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="hidden sm:block leading-tight">
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
  const [logoutApi] = useLogoutMutation();
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

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="w-64 bg-ink-900 text-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
        <div className="px-6 py-5 border-b border-ink-800 shrink-0">
          <Wordmark light size="text-xl" />
          <p className="text-xs text-slate-500 mt-1">{user?.role}</p>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto py-4 space-y-0.5 sidebar-scroll">
          {visibleNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navLinkClasses}>
              <Icon size={20} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}

          <NavLink
            to="/notifications"
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

      <main className="flex-1 overflow-y-auto">
        <TopBar user={user} unreadCount={unreadCount} />
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;