import mongoose from "mongoose";

const LEAD_SOURCES = ["Website", "Referral", "Social Media", "Email", "Phone"];
const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Unqualified", "Converted", "Lost"];
const LEAD_PRIORITIES = ["Low", "Medium", "High"];

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    source: { type: String, enum: LEAD_SOURCES, required: true },
    status: { type: String, enum: LEAD_STATUSES, default: "New", index: true },
    priority: { type: String, enum: LEAD_PRIORITIES, default: "Medium", index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notes: [noteSchema],
    // Guards against double conversion (section 3: prevent accidental duplicate conversion)
    isConverted: { type: Boolean, default: false, index: true },
    convertedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    convertedDeal: { type: mongoose.Schema.Types.ObjectId, ref: "Deal", default: null },
    convertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound indexes for common filter combos + text search
leadSchema.index({ status: 1, priority: 1, assignedTo: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ name: "text", email: "text", company: "text" });

export const LEAD_SOURCES_LIST = LEAD_SOURCES;
export const LEAD_STATUSES_LIST = LEAD_STATUSES;
export const LEAD_PRIORITIES_LIST = LEAD_PRIORITIES;
export default mongoose.model("Lead", leadSchema);
