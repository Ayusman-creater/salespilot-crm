import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, X } from "lucide-react";
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation } from "../features/users/usersApi";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const ROLES = ["Admin", "Sales Manager", "Sales Executive"];

const inputClasses =
  "w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500";
const selectClasses = `${inputClasses} bg-white`;

const emptyForm = { name: "", email: "", password: "", role: "Sales Executive", manager: "" };

const Users = () => {
  const { data, isLoading } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pendingDeactivate, setPendingDeactivate] = useState(null); // user object queued for confirmation

  const users = data?.data || [];
  const managers = users.filter((u) => u.role === "Sales Manager");

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.manager) delete payload.manager;
      await createUser(payload).unwrap();
      toast.success("User created");
      setForm(emptyForm);
      setShowCreate(false);
    } catch (err) {
      const msg = err?.data?.errors?.[0]?.message || err?.data?.message || "Failed to create user";
      toast.error(msg);
    }
  };

  // Reactivating is harmless and reversible with one click either way, so it
  // doesn't need a confirmation — only deactivating (which locks someone out)
  // goes through the dialog.
  const handleToggleActive = (user) => {
    if (user.isActive) {
      setPendingDeactivate(user);
    } else {
      reactivate(user);
    }
  };

  const reactivate = async (user) => {
    try {
      await updateUser({ id: user._id, isActive: true }).unwrap();
      toast.success(`${user.name} reactivated`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update user");
    }
  };

  const confirmDeactivate = async () => {
    if (!pendingDeactivate) return;
    try {
      await updateUser({ id: pendingDeactivate._id, isActive: false }).unwrap();
      toast.success(`${pendingDeactivate.name} deactivated`);
      setPendingDeactivate(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update user");
    }
  };

  const handleRoleChange = async (user, role) => {
    try {
      await updateUser({ id: user._id, role }).unwrap();
      toast.success(`${user.name}'s role updated to ${role}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update role");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage team members and roles. Admin only.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shrink-0"
        >
          <Plus size={16} strokeWidth={2} /> New User
        </button>
      </div>

      {/* overflow-x-auto: on narrow screens the table scrolls horizontally
          within its own card instead of squashing columns unreadably. */}
      <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-slate-50 text-slate-500 text-left border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      disabled={isUpdating}
                      className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white disabled:opacity-60"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge tone={u.isActive ? "emerald" : "slate"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                        u.isActive
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      }`}
                    >
                      {u.isActive ? "Deactivate" : "Reactivate"}
                    </button>
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
              <h2 className="text-lg font-bold text-slate-900">New User</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                required
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClasses}
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClasses}
              />
              <input
                required
                type="password"
                minLength={6}
                placeholder="Password (min 6 characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClasses}
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={selectClasses}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {form.role === "Sales Executive" && (
                <div>
                  <label className="text-xs text-slate-500">Reports to (optional)</label>
                  <select
                    value={form.manager}
                    onChange={(e) => setForm({ ...form, manager: e.target.value })}
                    className={`${selectClasses} mt-1`}
                  >
                    <option value="">No manager</option>
                    {managers.map((m) => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium text-sm py-2.5 rounded-md mt-2 transition-colors"
              >
                {isCreating ? "Creating…" : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Deactivate this user?"
        description={
          pendingDeactivate
            ? `${pendingDeactivate.name} will be locked out immediately and won't be able to log in until reactivated.`
            : ""
        }
        confirmLabel="Deactivate"
        danger
        isLoading={isUpdating}
        onConfirm={confirmDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
};

export default Users;