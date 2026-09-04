import mongoose from "mongoose";

const ACTIVITY_TYPES = ["Call", "Email", "Meeting", "Demo", "Reminder"];
const ACTIVITY_STATUSES = ["Pending", "Completed", "Overdue"];

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    subject: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    dueDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ACTIVITY_STATUSES, default: "Pending", index: true },
    completedAt: { type: Date, default: null },
    // Polymorphic-ish relation: activity can belong to a lead, customer, or deal
    relatedTo: {
      kind: { type: String, enum: ["Lead", "Customer", "Deal"], required: true },
      item: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "relatedTo.kind" },
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

activitySchema.index({ "relatedTo.kind": 1, "relatedTo.item": 1 });
activitySchema.index({ status: 1, dueDate: 1 });

export const ACTIVITY_TYPES_LIST = ACTIVITY_TYPES;
export const ACTIVITY_STATUSES_LIST = ACTIVITY_STATUSES;
export default mongoose.model("Activity", activitySchema);
