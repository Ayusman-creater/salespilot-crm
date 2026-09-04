import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGetCustomerQuery } from "../features/customers/customersApi";
import { useGetTimelineQuery } from "../features/timeline/timelineApi";
import Badge from "../components/Badge.jsx";

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

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetCustomerQuery(id);
  const { data: timelineData } = useGetTimelineQuery({ kind: "Customer", id }, { skip: !id });

  if (isLoading) return <div className="text-slate-500">Loading…</div>;
  const customer = data?.data?.customer;
  const deals = data?.data?.deals || [];
  if (!customer) return <div className="text-red-600">Customer not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate("/customers")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to Customers
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{customer.name}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {customer.company || "No company"} · {customer.email || "No email"} · {customer.phone || "No phone"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Assigned to {customer.assignedTo?.name || "Unassigned"} · Converted from lead{" "}
          <Link to={`/leads/${customer.sourceLead?._id}`} className="text-indigo-600 hover:underline">
            {customer.sourceLead?.name}
          </Link>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Deals</h2>
        {deals.length === 0 ? (
          <p className="text-sm text-slate-400">No deals yet.</p>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
              <Link
                key={deal._id}
                to={`/deals/${deal._id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{deal.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtCurrency(deal.value)} · {deal.probability}% probability</p>
                </div>
                <Badge tone={STAGE_TONE[deal.stage]}>{deal.stage}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

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

export default CustomerDetail;