import toast from "react-hot-toast";
import { CheckCheck } from "lucide-react";
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from "../features/notifications/notificationsApi";

const Notifications = () => {
  const { data, isLoading } = useGetNotificationsQuery();
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = data?.data || [];

  const handleMarkAll = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">Lead/deal assignments, follow-up reminders, closures.</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAll}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-slate-400">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-400">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markAsRead(n._id)}
              className={`px-4 py-3 cursor-pointer hover:bg-slate-50 ${!n.isRead ? "bg-indigo-50/50" : ""}`}
            >
              <div className="flex items-start gap-3">
                {!n.isRead && <span className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0" />}
                <div className={n.isRead ? "ml-5" : ""}>
                  <p className="text-sm text-slate-800">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;