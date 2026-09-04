import mongoose from "mongoose";

const DEAL_STAGES = ["Qualification", "Discovery", "Proposal", "Negotiation", "Won", "Lost"];

// Valid forward-moving transitions + terminal stages (Won/Lost are closed, no further moves)
export const VALID_TRANSITIONS = {
  Qualification: ["Discovery", "Lost"],
  Discovery: ["Proposal", "Lost"],
  Proposal: ["Negotiation", "Lost"],
  Negotiation: ["Won", "Lost"],
  Won: [],
  Lost: [],
};

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    sourceLead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    stage: { type: String, enum: DEAL_STAGES, default: "Qualification", index: true },
    value: { type: Number, required: true, min: 0 },
    probability: { type: Number, required: true, min: 0, max: 100, default: 20 },
    expectedClosingDate: { type: Date, required: true },
    closedAt: { type: Date, default: null },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isClosed: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Expected revenue = value * probability, always kept in sync via virtual (section 4)
dealSchema.virtual("expectedRevenue").get(function () {
  return Math.round(((this.value || 0) * (this.probability || 0)) / 100);
});
dealSchema.set("toJSON", { virtuals: true });
dealSchema.set("toObject", { virtuals: true });

dealSchema.index({ stage: 1, assignedTo: 1 });
dealSchema.index({ expectedClosingDate: 1 });
dealSchema.index({ createdAt: -1 });

export const DEAL_STAGES_LIST = DEAL_STAGES;
export default mongoose.model("Deal", dealSchema);
