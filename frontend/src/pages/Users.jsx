import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, X } from "lucide-react";
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation } from "../features/users/usersApi";
import Badge from "../components/Badge.jsx";

const ROLES = ["Admin", "Sales Manager", "Sales Executive"];
const ROLE_TONE = { Admin: "red", "Sales Manager": "indigo", "Sales Executive": "blue" };

const emptyForm = { name: "", email: "", password: "", role: "Sales Executive", manager: "" };

const Users = () => {
  const { data, isLoading } = useGetUsersQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

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

  const handleToggleActive = async (user) => {
    try {
      await updateUser({ id: user._id, isActive: !user.isActive }).unwrap();
      toast.success(`${user.name} ${user.isActive ? "deactivated" : "reactivated"}`);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage team members and roles. Admin only.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> New User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
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
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.isActive ? "emerald" : "slate"}>
                      {u.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-md ${
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
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">New User</h2>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <input
                required
                type="password"
                minLength={6}
                placeholder="Password (min 6 characters)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {form.role === "Sales Executive" && (
                <div>
                  <label className="text-xs text-slate-500">Reports to (optional)</label>
                  <select
                    value={form.manager}
                    onChange={(e) => setForm({ ...form, manager: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white mt-1"
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
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium text-sm py-2.5 rounded-lg mt-2"
              >
                {isCreating ? "Creating…" : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;