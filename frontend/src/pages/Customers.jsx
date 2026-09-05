import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useGetCustomersQuery } from "../features/customers/customersApi";

const inputClasses =
  "w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500";

const Customers = () => {
  const [filters, setFilters] = useState({ search: "", page: 1 });
  const queryParams = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
  const { data, isLoading, isFetching } = useGetCustomersQuery(queryParams);

  const customers = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="text-sm text-slate-500 mt-1">Customers converted from qualified leads.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-4">
        <div className="relative w-full sm:max-w-sm">
          <Search size={16} strokeWidth={1.75} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search customers…"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className={inputClasses}
          />
        </div>
      </div>

      {/* overflow-x-auto: on narrow screens the table scrolls horizontally
          within its own card instead of squashing columns unreadably. */}
      <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-slate-50 text-slate-500 text-left border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Assigned To</th>
              <th className="px-4 py-2.5 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  {filters.search ? "No customers match this search." : "No customers yet — they'll appear here once a lead converts."}
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c._id} className={`hover:bg-slate-50 transition-colors ${isFetching ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link to={`/customers/${c._id}`} className="font-medium text-indigo-600 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.company || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.email || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.assignedTo?.name || "Unassigned"}</td>
                  <td className="px-4 py-3 text-slate-500 tabular-nums whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-slate-500">
          <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
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
    </div>
  );
};

export default Customers;