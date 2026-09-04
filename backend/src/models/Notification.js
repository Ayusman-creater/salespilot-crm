import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "lead_assigned",
        "deal_assigned",
        "followup_upcoming",
        "followup_overdue",
        "lead_converted",
        "deal_closed",
      ],
      required: true,
    },
    message: { type: String, required: true },
    link: { type: String, default: null }, // frontend route to deep-link to
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
