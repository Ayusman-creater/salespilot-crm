import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import { useGetDealQuery, useUpdateDealMutation, useUpdateDealStageMutation } from "../features/deals/dealsApi";
import { useGetTimelineQuery } from "../features/timeline/timelineApi";
import Badge from "../components/Badge.jsx";

const VALID_TRANSITIONS = {
  Qualification: ["Discovery", "Lost"],
  Discovery: ["Proposal", "Lost"],
  Proposal: ["Negotiation", "Lost"],
  Negotiation: ["Won", "Lost"],
  Won: [],
  Lost: [],
};

const STAGE_TONE = {
  Qualification: "slate",
  Discovery: "blue",
  Proposal: "amber",
  Negotiation: "indigo",
  Won: "emerald",
  Lost: "red",
};

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const DealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetDealQuery(id);
  const { data: timelineData } = useGetTimelineQuery({ kind: "Deal", id }, { skip: !id });
  const [updateDeal] = useUpdateDealMutation();
  const [updateStage] = useUpdateDealStageMutation();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  if (isLoading) return <div className="text-slate-500">Loading…</div>;
  const deal = data?.data;
  if (!deal) return <div className="text-red-600">Deal not found.</div>;

  const startEdit = () => {
    setForm({
      value: deal.value,
      probability: deal.probability,
      expectedClosingDate: deal.expectedClosingDate?.slice(0, 10),
    });
    setEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateDeal({ id, value: Number(form.value), probability: Number(form.probability), expectedClosingDate: form.expectedClosingDate }).unwrap();
      toast.success("Deal updated");
      setEditing(false);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update deal");
    }
  };

  const handleMove = async (stage) => {
    try {
      await updateStage({ id, stage }).unwrap();
      toast.success(`Deal moved to ${stage}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to move deal");
    }
  };

  const nextStages = VALID_TRANSITIONS[deal.stage] || [];
  const expectedRevenue = Math.round((deal.value * deal.probability) / 100);

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate("/deals")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to Pipeline
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{deal.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            <Link to={`/customers/${deal.customer?._id}`} className="text-indigo-600 hover:underline">
              {deal.customer?.name}
            </Link>{" "}
            · {deal.customer?.company}
          </p>
        </div>
        <Badge tone={STAGE_TONE[deal.stage]}>{deal.stage}</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Deal Value</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{fmtCurrency(deal.value)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Probability</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{deal.probability}%</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Expected Revenue</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{fmtCurrency(expectedRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase">Closing Date</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">
            {new Date(deal.expectedClosingDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {!deal.isClosed && (
        <div className="flex gap-3">
          {nextStages.length > 0 && (
            <div className="flex gap-2">
              {nextStages.map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleMove(stage)}
                  className={`text-sm font-medium px-4 py-2 rounded-lg ${
                    stage === "Lost"
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : stage === "Won"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "bg-slate-800 text-white hover:bg-slate-900"
                  }`}
                >
                  Move to {stage}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={startEdit}
            className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Edit Details
          </button>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Edit Deal</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500">Deal value</label>
                <input
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.probability}
                  onChange={(e) => setForm({ ...form, probability: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Expected closing date</label>
                <input
                  type="date"
                  value={form.expectedClosingDate}
                  onChange={(e) => setForm({ ...form, expectedClosingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="flex-1 border border-slate-300 text-slate-700 text-sm font-medium py-2.5 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Timeline</h2>
        <div className="space-y-3">
          {timelineData?.data?.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
          {timelineData?.data?.map((event) => (
            <div key={event._id} className="text-sm border-l-2 border-indigo-200 pl-3">
              <p className="text-slate-700">{event.description}</p>
              <p className="text-xs text-slate-400 mt-0.5">{new Date(event.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DealDetail;