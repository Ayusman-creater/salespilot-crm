import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, X, Check, Trash2 } from "lucide-react";
import {
  useGetActivitiesQuery,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
} from "../features/activities/activitiesApi";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const TYPES = ["Call", "Email", "Meeting", "Demo", "Reminder"];
const STATUSES = ["Pending", "Completed", "Overdue"];
const KINDS = ["Lead", "Customer", "Deal"];

const STATUS_TONE = { Pending: "amber", Completed: "emerald", Overdue: "red" };

const inputClasses =
  "w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500";
const selectClasses = `${inputClasses} bg-white`;

const emptyForm = {
  type: "Call",
  subject: "",
  notes: "",
  dueDate: "",
  relatedTo: { kind: "Lead", item: "" },
};

const Activities = () => {
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState(null); // activity object queued for delete confirmation

  const queryParams = statusFilter ? { status: statusFilter, limit: 50 } : { limit: 50 };
  const { data, isLoading } = useGetActivitiesQuery(queryParams);
  const [createActivity, { isLoading: isCreating }] = useCreateActivityMutation();
  const [updateActivity] = useUpdateActivityMutation();
  const [deleteActivity, { isLoading: isDeleting }] = useDeleteActivityMutation();

  const activities = data?.data || [];

  const handleComplete = async (id) => {
    try {
      await updateActivity({ id, status: "Completed" }).unwrap();
      toast.success("Marked as completed");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteActivity(pendingDelete._id).unwrap();
      toast.success("Activity deleted");
      setPendingDelete(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.relatedTo.item.trim()) {
      toast.error("relatedTo.item (a Lead/Customer/Deal ID) is required");
      return;
    }
    try {
      await createActivity(form).unwrap();
      toast.success("Activity created");
      setForm(emptyForm);
      setShowCreate(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create activity");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activities</h1>
          <p className="text-sm text-slate-500 mt-1">Follow-ups: calls, emails, meetings, demos, reminders.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shrink-0"
        >
          <Plus size={16} strokeWidth={2} /> New Activity
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-4 flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${selectClasses} w-full sm:w-auto`}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* overflow-x-auto: on narrow screens the table scrolls horizontally
          within its own card instead of squashing columns unreadably. */}
      <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 text-slate-500 text-left border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Subject</th>
              <th className="px-4 py-2.5 font-medium">Due Date</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Assigned To</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No activities found.</td></tr>
            ) : (
              activities.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{a.type}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-800">{a.subject}</p>
                    {a.notes && <p className="text-xs text-slate-400 mt-0.5">{a.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 tabular-nums whitespace-nowrap">
                    {new Date(a.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3"><Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge></td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.assignedTo?.name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {a.status !== "Completed" && (
                        <button
                          onClick={() => handleComplete(a._id)}
                          title="Mark completed"
                          className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        >
                          <Check size={14} strokeWidth={2} />
                        </button>
                      )}
                      <button
                        onClick={() => setPendingDelete(a)}
                        title="Delete"
                        className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md w-full max-w-md p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">New Activity</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={selectClasses}
              >
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                required
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className={inputClasses}
              />
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputClasses}
                rows={2}
              />
              <div>
                <label className="text-xs text-slate-500">Due date</label>
                <input
                  required
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className={`${inputClasses} mt-1`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500">Related to</label>
                  <select
                    value={form.relatedTo.kind}
                    onChange={(e) => setForm({ ...form, relatedTo: { ...form.relatedTo, kind: e.target.value } })}
                    className={`${selectClasses} mt-1`}
                  >
                    {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500">{form.relatedTo.kind} ID</label>
                  <input
                    required
                    placeholder="Paste ID"
                    value={form.relatedTo.item}
                    onChange={(e) => setForm({ ...form, relatedTo: { ...form.relatedTo, item: e.target.value } })}
                    className={`${inputClasses} mt-1`}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Tip: open the Lead/Customer/Deal you want to follow up on and copy its ID from the URL.
              </p>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium text-sm py-2.5 rounded-md mt-2 transition-colors"
              >
                {isCreating ? "Creating…" : "Create Activity"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this activity?"
        description={pendingDelete ? `"${pendingDelete.subject}" will be permanently removed. This cannot be undone.` : ""}
        confirmLabel="Delete"
        danger
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Activities;