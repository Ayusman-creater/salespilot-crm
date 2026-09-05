import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { ArrowLeft, UserCog, Sparkles } from "lucide-react";
import {
  useGetLeadQuery,
  useUpdateLeadMutation,
  useAssignLeadMutation,
  useAddLeadNoteMutation,
  useConvertLeadMutation,
} from "../features/leads/leadsApi";
import { useGetUsersQuery } from "../features/users/usersApi";
import { useGetTimelineQuery } from "../features/timeline/timelineApi";
import { selectCurrentUser } from "../features/auth/authSlice";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const STATUSES = ["New", "Contacted", "Qualified", "Unqualified", "Converted", "Lost"];
const PRIORITIES = ["Low", "Medium", "High"];

const inputClasses =
  "w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500";
const selectClasses = `${inputClasses} bg-white`;

const fmtCurrency = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const canReassign = user?.role === "Admin" || user?.role === "Sales Manager";

  const { data, isLoading } = useGetLeadQuery(id);
  const { data: usersData } = useGetUsersQuery(undefined, { skip: !canReassign });
  const { data: timelineData } = useGetTimelineQuery({ kind: "Lead", id }, { skip: !id });

  const [updateLead] = useUpdateLeadMutation();
  const [assignLead] = useAssignLeadMutation();
  const [addNote] = useAddLeadNoteMutation();
  const [convertLead, { isLoading: isConverting }] = useConvertLeadMutation();

  const [noteText, setNoteText] = useState("");
  const [showConvert, setShowConvert] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false); // final "are you sure" step, since conversion can't be undone
  const [dealForm, setDealForm] = useState({ dealTitle: "", dealValue: "", dealProbability: 20, expectedClosingDate: "" });

  if (isLoading) return <div className="text-slate-500">Loading…</div>;
  const lead = data?.data;
  if (!lead) return <div className="text-red-600">Lead not found.</div>;

  const handleStatusChange = async (status) => {
    try {
      await updateLead({ id, status }).unwrap();
      toast.success("Status updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  };

  const handlePriorityChange = async (priority) => {
    try {
      await updateLead({ id, priority }).unwrap();
      toast.success("Priority updated");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to update priority");
    }
  };

  const handleAssign = async (assignedTo) => {
    if (!assignedTo) return;
    try {
      await assignLead({ id, assignedTo }).unwrap();
      toast.success("Lead reassigned");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to reassign");
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await addNote({ id, text: noteText }).unwrap();
      setNoteText("");
      toast.success("Note added");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add note");
    }
  };

  // Step 1: form is filled out and submitted -> just moves to the final
  // confirmation step. The actual API call only happens after that second
  // confirmation, since conversion is irreversible (the backend blocks
  // re-converting an already-converted lead).
  const handleConvertFormSubmit = (e) => {
    e.preventDefault();
    setShowConvert(false);
    setConfirmConvert(true);
  };

  // Step 2: user confirmed -> actually call the API.
  const handleConfirmConvert = async () => {
    try {
      const res = await convertLead({
        id,
        dealTitle: dealForm.dealTitle,
        dealValue: Number(dealForm.dealValue),
        dealProbability: Number(dealForm.dealProbability),
        expectedClosingDate: dealForm.expectedClosingDate,
      }).unwrap();
      toast.success("Lead converted to customer + deal");
      setConfirmConvert(false);
      navigate(`/deals/${res.data.deal._id}`);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to convert lead");
      setConfirmConvert(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate("/leads")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft size={16} /> Back to Leads
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
          <p className="text-sm text-slate-500 mt-1">{lead.company || "No company"} · {lead.email || "No email"} · {lead.phone || "No phone"}</p>
        </div>
        {!lead.isConverted && lead.status === "Qualified" && (
          <button
            onClick={() => setShowConvert(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shrink-0"
          >
            <Sparkles size={16} strokeWidth={2} /> Convert to Customer
          </button>
        )}
        {lead.isConverted && (
          <Link
            to={`/customers/${lead.convertedCustomer}`}
            className="text-sm font-medium text-indigo-600 hover:underline shrink-0"
          >
            View converted customer →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-md p-4">
          <label className="text-xs font-medium text-slate-500 uppercase">Status</label>
          <select
            value={lead.status}
            disabled={lead.isConverted}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`${selectClasses} mt-2 disabled:bg-slate-50`}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4">
          <label className="text-xs font-medium text-slate-500 uppercase">Priority</label>
          <select
            value={lead.priority}
            disabled={lead.isConverted}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className={`${selectClasses} mt-2 disabled:bg-slate-50`}
          >
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="bg-white border border-slate-200 rounded-md p-4">
          <label className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1.5">
            <UserCog size={13} strokeWidth={1.75} /> Assigned To
          </label>
          {canReassign ? (
            <select
              defaultValue={lead.assignedTo?._id || ""}
              onChange={(e) => handleAssign(e.target.value)}
              className={`${selectClasses} mt-2`}
            >
              <option value="" disabled>Select user</option>
              {usersData?.data?.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          ) : (
            <p className="mt-2 text-sm text-slate-700 py-2">{lead.assignedTo?.name || "Unassigned"}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Badge>{lead.source}</Badge>
        {lead.isConverted && <Badge tone="emerald">Converted</Badge>}
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Notes</h2>
        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {lead.notes?.length === 0 && <p className="text-sm text-slate-400">No notes yet.</p>}
          {lead.notes?.slice().reverse().map((note) => (
            <div key={note._id} className="text-sm bg-slate-50 rounded-md p-3">
              <p className="text-slate-700">{note.text}</p>
              <p className="text-xs text-slate-400 mt-1">
                {note.createdBy?.name || "Unknown"} · {new Date(note.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        {!lead.isConverted && (
          <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-2">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note…"
              className={`flex-1 ${inputClasses}`}
            />
            <button type="submit" className="bg-ink-900 hover:bg-ink-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shrink-0">
              Add
            </button>
          </form>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-md p-5">
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

      {/* Step 1: deal details form */}
      {showConvert && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md w-full max-w-md p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Convert Lead to Customer + Deal</h2>
            <form onSubmit={handleConvertFormSubmit} className="space-y-3">
              <input
                required
                placeholder="Deal title"
                value={dealForm.dealTitle}
                onChange={(e) => setDealForm({ ...dealForm, dealTitle: e.target.value })}
                className={inputClasses}
              />
              <input
                required
                type="number"
                min="0"
                placeholder="Deal value"
                value={dealForm.dealValue}
                onChange={(e) => setDealForm({ ...dealForm, dealValue: e.target.value })}
                className={inputClasses}
              />
              <div>
                <label className="text-xs text-slate-500">Probability (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dealForm.dealProbability}
                  onChange={(e) => setDealForm({ ...dealForm, dealProbability: e.target.value })}
                  className={`${inputClasses} mt-1`}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Expected closing date</label>
                <input
                  required
                  type="date"
                  value={dealForm.expectedClosingDate}
                  onChange={(e) => setDealForm({ ...dealForm, expectedClosingDate: e.target.value })}
                  className={`${inputClasses} mt-1`}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConvert(false)}
                  className="flex-1 border border-slate-200 text-slate-700 text-sm font-medium py-2.5 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: final "are you sure" — this is the irreversible point */}
      <ConfirmDialog
        open={confirmConvert}
        title="Convert this lead?"
        description={`This will create a new customer and a "${dealForm.dealTitle}" deal (${fmtCurrency(dealForm.dealValue)}) and cannot be undone — the lead can't be re-converted afterward.`}
        confirmLabel={isConverting ? "Converting…" : "Convert"}
        isLoading={isConverting}
        onConfirm={handleConfirmConvert}
        onCancel={() => {
          setConfirmConvert(false);
          setShowConvert(true); // let them go back and edit instead of losing their input
        }}
      />
    </div>
  );
};

export default LeadDetail;