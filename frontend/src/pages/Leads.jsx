import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { useGetLeadsQuery, useCreateLeadMutation } from "../features/leads/leadsApi";
import Badge from "../components/Badge.jsx";

const STATUS_TONE = {
  New: "blue",
  Contacted: "amber",
  Qualified: "indigo",
  Unqualified: "red",
  Converted: "emerald",
  Lost: "red",
};
const PRIORITY_TONE = { Low: "slate", Medium: "amber", High: "red" };

const SOURCES = ["Website", "Referral", "Social Media", "Email", "Phone"];
const STATUSES = ["New", "Contacted", "Qualified", "Unqualified", "Converted", "Lost"];
const PRIORITIES = ["Low", "Medium", "High"];

const emptyForm = { name: "", email: "", phone: "", company: "", source: "Website", priority: "Medium" };

const selectClasses =
  "px-3 py-2 border border-slate-200 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-auto";
const inputClasses =
  "w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500";

const Leads = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({ status: "", priority: "", source: "", search: "", page: 1 });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && STATUSES.includes(statusParam)) {
      setFilters((f) => ({ ...f, status: statusParam, page: 1 }));
    }
    if (searchParams.get("new") === "1") {
      setShowCreate(true);
    }
  }, [searchParams]);

  const queryParams = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
  const { data, isLoading, isFetching } = useGetLeadsQuery(queryParams);
  const [createLead, { isLoading: isCreating }] = useCreateLeadMutation();

  const leads = data?.data || [];
  const pagination = data?.pagination;

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const closeCreate = () => {
    setShowCreate(false);
    if (searchParams.get("new")) {
      searchParams.delete("new");
      setSearchParams(searchParams);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createLead(form).unwrap();
      toast.success("Lead created");
      setForm(emptyForm);
      closeCreate();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create lead");
    }
  };

  const activeFilterCount = [filters.status, filters.priority, filters.source, filters.search].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track incoming leads.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shrink-0"
        >
          <Plus size={16} strokeWidth={2} /> New Lead
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center">
        <div className="relative flex-1 min-w-full sm:min-w-[200px]">
          <Search size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search leads…"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className={`${inputClasses} pl-9`}
          />
        </div>
        <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-3">
          <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} className={selectClasses}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.priority} onChange={(e) => updateFilter("priority", e.target.value)} className={selectClasses}>
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.source} onChange={(e) => updateFilter("source", e.target.value)} className={selectClasses}>
            <option value="">All Sources</option>
            {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={() => setFilters({ status: "", priority: "", source: "", search: "", page: 1 })}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 px-2 text-left sm:text-center"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* overflow-x-auto: on narrow screens the table scrolls horizontally
          within its own card instead of squashing columns unreadably. */}
      <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 text-slate-500 text-left border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="px-4 py-2.5 font-medium">Source</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Priority</th>
              <th className="px-4 py-2.5 font-medium">Assigned To</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  {activeFilterCount > 0 ? "No leads match these filters." : "No leads yet — create your first one to get started."}
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead._id} className={`hover:bg-slate-50 transition-colors ${isFetching ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link to={`/leads/${lead._id}`} className="font-medium text-indigo-600 hover:underline">
                      {lead.name}
                    </Link>
                    {lead.email && <div className="text-xs text-slate-400">{lead.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.company || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.source}</td>
                  <td className="px-4 py-3"><Badge tone={STATUS_TONE[lead.status]}>{lead.status}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={PRIORITY_TONE[lead.priority]}>{lead.priority}</Badge></td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{lead.assignedTo?.name || "Unassigned"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="flex-1 sm:flex-none px-3 py-1.5 border border-slate-200 rounded-md disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md w-full max-w-md p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">New Lead</h2>
              <button onClick={closeCreate} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClasses}
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClasses}
              />
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClasses}
              />
              <input
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={inputClasses}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className={selectClasses}
                >
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className={selectClasses}
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium text-sm py-2.5 rounded-md mt-2 transition-colors"
              >
                {isCreating ? "Creating…" : "Create Lead"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;