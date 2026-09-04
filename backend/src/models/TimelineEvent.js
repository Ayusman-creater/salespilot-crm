import mongoose from "mongoose";

// Lightweight append-only audit trail for leads/customers/deals (section 5)
const timelineEventSchema = new mongoose.Schema(
  {
    relatedTo: {
      kind: { type: String, enum: ["Lead", "Customer", "Deal"], required: true },
      item: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "relatedTo.kind" },
    },
    action: { type: String, required: true }, // e.g. "created", "assigned", "status_changed", "converted"
    description: { type: String, required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

timelineEventSchema.index({ "relatedTo.kind": 1, "relatedTo.item": 1, createdAt: -1 });

export default mongoose.model("TimelineEvent", timelineEventSchema);
