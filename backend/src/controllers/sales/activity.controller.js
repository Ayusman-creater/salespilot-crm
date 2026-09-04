import asyncHandler from "express-async-handler";
import Activity from "../../models/Activity.js";
import { buildScopeFilter, canAccessRecord } from "../../middleware/scope.js";
import { buildPagination, buildSort, paginatedResponse } from "../../utils/queryHelper.js";

// @route GET /api/activities
export const getActivities = asyncHandler(async (req, res) => {
  const { status, type, relatedKind, relatedId } = req.query;
  const { page, limit, skip } = buildPagination(req.query);
  const sort = buildSort(req.query, ["dueDate", "createdAt"], "dueDate");

  const scope = await buildScopeFilter(req.user, "assignedTo");
  const filter = { ...scope };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (relatedKind && relatedId) {
    filter["relatedTo.kind"] = relatedKind;
    filter["relatedTo.item"] = relatedId;
  }

  // Auto-flip Pending -> Overdue for anything past due before returning
  await Activity.updateMany(
    { ...filter, status: "Pending", dueDate: { $lt: new Date() } },
    { $set: { status: "Overdue" } }
  );

  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate("assignedTo", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Activity.countDocuments(filter),
  ]);

  res.json(paginatedResponse(activities, total, page, limit));
});

// @route POST /api/activities
export const createActivity = asyncHandler(async (req, res) => {
  const { type, subject, notes, dueDate, relatedTo, assignedTo } = req.body;

  if (!type || !subject || !dueDate || !relatedTo?.kind || !relatedTo?.item) {
    res.status(400);
    throw new Error("type, subject, dueDate and relatedTo{kind,item} are required");
  }

  const activity = await Activity.create({
    type,
    subject,
    notes,
    dueDate,
    relatedTo,
    assignedTo: assignedTo || req.user._id,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: activity });
});

// @route PUT /api/activities/:id
export const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) {
    res.status(404);
    throw new Error("Activity not found");
  }

  const allowed = await canAccessRecord(req.user, activity, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this activity");
  }

  const { subject, notes, dueDate, status } = req.body;
  if (subject) activity.subject = subject;
  if (notes !== undefined) activity.notes = notes;
  if (dueDate) activity.dueDate = dueDate;
  if (status) {
    activity.status = status;
    if (status === "Completed") activity.completedAt = new Date();
  }

  await activity.save();
  res.json({ success: true, data: activity });
});

// @route DELETE /api/activities/:id
export const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) {
    res.status(404);
    throw new Error("Activity not found");
  }

  const allowed = await canAccessRecord(req.user, activity, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this activity");
  }

  await activity.deleteOne();
  res.json({ success: true, message: "Activity deleted" });
});
