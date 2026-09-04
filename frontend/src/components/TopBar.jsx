import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search, Bell, Plus } from "lucide-react";
import { selectCurrentUser } from "../features/auth/authSlice";
import { useGetNotificationsQuery } from "../features/notifications/notificationsApi";

const getInitials = (name = "") =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

const TopBar = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data: notifData } = useGetNotificationsQuery(undefined, {
    pollingInterval: 60000,
    skip: !user,
  });

  const unreadCount = notifData?.unreadCount || 0;

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-3 bg-white border-b border-slate-200">
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

        <div className="flex items-center gap-2.5 pl-1 border-l border-slate-200 ml-1">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;