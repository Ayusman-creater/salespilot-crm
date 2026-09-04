import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useGetDealsQuery, useUpdateDealStageMutation } from "../features/deals/dealsApi";

const STAGES = ["Qualification", "Discovery", "Proposal", "Negotiation", "Won", "Lost"];
const OPEN_STAGES = ["Qualification", "Discovery", "Proposal", "Negotiation"];

const VALID_TRANSITIONS = {
  Qualification: ["Discovery", "Lost"],
  Discovery: ["Proposal", "Lost"],
  Proposal: ["Negotiation", "Lost"],
  Negotiation: ["Won", "Lost"],
  Won: [],
  Lost: [],
};

const STAGE_COLORS = {
  Qualification: "border-t-slate-400",
  Discovery: "border-t-blue-400",
  Proposal: "border-t-amber-400",
  Negotiation: "border-t-indigo-400",
  Won: "border-t-emerald-400",
  Lost: "border-t-red-400",
};

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const DealCard = ({ deal, onMove }) => {
  const nextStages = VALID_TRANSITIONS[deal.stage] || [];

  return (
    <div className="bg-white rounded-md border border-slate-200 p-3 space-y-2 hover:border-slate-300 transition-colors">
      <Link to={`/deals/${deal._id}`} className="font-medium text-sm text-slate-800 hover:text-indigo-600 block">
        {deal.title}
      </Link>
      <p className="text-xs text-slate-500">{deal.customer?.name}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 tabular-nums">{fmtCurrency(deal.value)}</span>
        <span className="text-slate-400 tabular-nums">{deal.probability}%</span>
      </div>
      <p className="text-xs text-slate-400 tabular-nums">
        Closing {new Date(deal.expectedClosingDate).toLocaleDateString()}
      </p>
      {nextStages.length > 0 && (
        <div className="flex gap-1.5 pt-1">
          {nextStages.map((stage) => (
            <button
              key={stage}
              onClick={() => onMove(deal._id, stage)}
              className={`text-xs px-2 py-1 rounded-md font-medium flex-1 transition-colors ${
                stage === "Lost"
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : stage === "Won"
                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              → {stage}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Deals = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [assignedTo, setAssignedTo] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "", "Open", "Won", "Lost"

  useEffect(() => {
    const status = searchParams.get("status");
    const owner = searchParams.get("owner");
    if (status) setStatusFilter(status);
    if (owner) setAssignedTo(owner);
  }, [searchParams]);

  const { data, isLoading } = useGetDealsQuery({ limit: 100, ...(assignedTo ? { assignedTo } : {}) });
  const [updateStage] = useUpdateDealStageMutation();

  const allDeals = data?.data || [];

  const deals = statusFilter
    ? allDeals.filter((d) => {
        if (statusFilter === "Open") return OPEN_STAGES.includes(d.stage);
        return d.stage === statusFilter;
      })
    : allDeals;

  const clearFilters = () => {
    setStatusFilter("");
    setAssignedTo("");
    setSearchParams({});
  };

  const handleMove = async (id, stage) => {
    try {
      await updateStage({ id, stage }).unwrap();
      toast.success(`Deal moved to ${stage}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to move deal");
    }
  };

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {});

  const hasActiveFilter = statusFilter || assignedTo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deals Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">Qualification → Discovery → Proposal → Negotiation → Won/Lost</p>
        </div>
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-slate-200 rounded-md px-3 py-1.5 hover:bg-slate-50 transition-colors"
          >
            Clear filter{statusFilter ? ` (${statusFilter})` : ""}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-slate-500">Loading pipeline…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto">
          {STAGES.map((stage) => (
            <div key={stage} className={`bg-slate-50 rounded-md border-t-4 ${STAGE_COLORS[stage]} p-3 min-h-[300px]`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">{stage}</h3>
                <span className="text-xs text-slate-400 bg-white px-1.5 py-0.5 rounded-full border border-slate-200 tabular-nums">
                  {dealsByStage[stage].length}
                </span>
              </div>
              <div className="space-y-2">
                {dealsByStage[stage].length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No deals</p>
                ) : (
                  dealsByStage[stage].map((deal) => (
                    <DealCard key={deal._id} deal={deal} onMove={handleMove} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Deals;