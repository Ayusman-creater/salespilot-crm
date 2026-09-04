import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    sourceLead: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

customerSchema.index({ createdAt: -1 });
customerSchema.index({ name: "text", email: "text", company: "text" });

export default mongoose.model("Customer", customerSchema);
