import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ChevronRight, TrendingUp, Users2, Building2, Handshake, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useGetDashboardQuery } from "../features/dashboard/dashboardApi";
import { selectCurrentUser } from "../features/auth/authSlice";
import PipelineChart from "../components/PipelineChart";

const StatCard = ({ label, value, icon: Icon, onClick }) => (
  <div
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={(e) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) onClick();
    }}
    className={`group bg-white border rounded-md p-4 sm:p-5 transition-all ${
      onClick
        ? "cursor-pointer border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
        : "border-slate-200"
    }`}
  >
    <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
      <span className="text-xs sm:text-sm font-medium text-slate-500 truncate">{label}</span>
      <div className="flex items-center gap-1 shrink-0">
        <Icon size={16} strokeWidth={1.75} className="text-slate-400" />
        {onClick && (
          <ChevronRight
            size={14}
            strokeWidth={2}
            className="hidden sm:block text-indigo-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
          />
        )}
      </div>
    </div>
    <p className="text-lg sm:text-2xl font-bold text-slate-900 tabular-nums truncate">{value}</p>
  </div>
);

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const Dashboard = () => {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { data, isLoading, isError } = useGetDashboardQuery();
  const [teamSort, setTeamSort] = useState("wonRevenue");

  if (isLoading) return <div className="text-slate-500">Loading dashboard…</div>;
  if (isError || !data?.data) return <div className="text-red-600">Failed to load dashboard.</div>;

  const { leads, customers, deals, activities, teamPerformance } = data.data;

  const sortedTeam = teamPerformance
    ? [...teamPerformance].sort((a, b) => b[teamSort] - a[teamSort])
    : null;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "";
  const dateLabel = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div>
          <p className="text-sm font-medium text-indigo-600 mb-1">{greeting}, {firstName}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {user?.role === "Sales Executive" ? "My Dashboard" : "Team Dashboard"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {dateLabel} · Overview of sales performance and pipeline health.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Leads</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard label="Total" value={leads.total} icon={Users2} onClick={() => navigate("/leads")} />
          <StatCard label="New" value={leads.new} icon={Users2} onClick={() => navigate("/leads?status=New")} />
          <StatCard label="Qualified" value={leads.qualified} icon={Users2} onClick={() => navigate("/leads?status=Qualified")} />
          <StatCard label="Converted" value={leads.converted} icon={Users2} onClick={() => navigate("/leads?status=Converted")} />
          <StatCard label="Lost" value={leads.lost} icon={Users2} onClick={() => navigate("/leads?status=Lost")} />
          <StatCard label="Conv. Rate" value={`${leads.conversionRate}%`} icon={TrendingUp} />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Customers</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Total Customers" value={customers.total} icon={Building2} onClick={() => navigate("/customers")} />
          <StatCard label="New (30 days)" value={customers.newLast30Days} icon={Building2} onClick={() => navigate("/customers")} />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Deals &amp; Revenue</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4">
          <StatCard label="Total Deals" value={deals.totalDeals} icon={Handshake} onClick={() => navigate("/deals")} />
          <StatCard label="Open" value={deals.openDeals} icon={Handshake} onClick={() => navigate("/deals?status=Open")} />
          <StatCard label="Won" value={deals.wonDeals} icon={Handshake} onClick={() => navigate("/deals?status=Won")} />
          <StatCard label="Lost" value={deals.lostDeals} icon={Handshake} onClick={() => navigate("/deals?status=Lost")} />
          <StatCard label="Pipeline Value" value={fmtCurrency(deals.pipelineValue)} icon={TrendingUp} />
          <StatCard label="Won Revenue" value={fmtCurrency(deals.wonRevenue)} icon={TrendingUp} />
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mb-4">
          Expected revenue across open deals:{" "}
          <span className="font-semibold text-slate-800 tabular-nums">{fmtCurrency(deals.expectedRevenue)}</span>
        </p>

        <PipelineChart data={deals.pipelineByStage} />
      </section>

      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Follow-up Activities</h2>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard label="Pending" value={activities.pending} icon={Clock} onClick={() => navigate("/activities?status=Pending")} />
          <StatCard label="Completed" value={activities.completed} icon={CheckCircle2} onClick={() => navigate("/activities?status=Completed")} />
          <StatCard label="Overdue" value={activities.overdue} icon={AlertTriangle} onClick={() => navigate("/activities?status=Overdue")} />
        </div>
      </section>

      {sortedTeam && (
        <section>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Team Performance</h2>
            <div className="flex items-center gap-1 text-xs">
              {[
                { key: "wonRevenue", label: "Revenue" },
                { key: "wonDeals", label: "Won" },
                { key: "totalDeals", label: "Total" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTeamSort(opt.key)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    teamSort === opt.key
                      ? "bg-indigo-600 text-white"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* overflow-x-auto lets this table scroll horizontally on narrow
              screens instead of squashing columns or breaking the page layout. */}
          <div className="bg-white border border-slate-200 rounded-md overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-slate-50 text-slate-500 text-left border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium text-right">Total Deals</th>
                  <th className="px-4 py-2.5 font-medium text-right">Won</th>
                  <th className="px-4 py-2.5 font-medium text-right">Won Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTeam.map((row) => (
                  <tr
                    key={row.user.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/deals?owner=${row.user.id}`)}
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">{row.user.name}</td>
                    <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{row.user.role}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.totalDeals}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.wonDeals}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{fmtCurrency(row.wonRevenue)}</td>
                  </tr>
                ))}
                {sortedTeam.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No team members yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;