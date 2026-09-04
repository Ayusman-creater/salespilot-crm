import asyncHandler from "express-async-handler";
import TimelineEvent from "../../models/TimelineEvent.js";

// @route GET /api/timeline/:kind/:id
export const getTimeline = asyncHandler(async (req, res) => {
  const { kind, id } = req.params;
  if (!["Lead", "Customer", "Deal"].includes(kind)) {
    res.status(400);
    throw new Error("Invalid timeline kind");
  }

  const events = await TimelineEvent.find({ "relatedTo.kind": kind, "relatedTo.item": id })
    .populate("performedBy", "name role")
    .sort("-createdAt");

  res.json({ success: true, data: events });
});
