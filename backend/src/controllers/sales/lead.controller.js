import asyncHandler from "express-async-handler";
import Lead from "../../models/Lead.js";
import Customer from "../../models/Customer.js";
import Deal from "../../models/Deal.js";
import { buildScopeFilter, canAccessRecord } from "../../middleware/scope.js";
import { buildPagination, buildSort, buildDateRangeFilter, paginatedResponse } from "../../utils/queryHelper.js";
import { logTimeline } from "../../utils/logTimeline.js";
import { notify } from "../../utils/notify.js";

// @route GET /api/leads
export const getLeads = asyncHandler(async (req, res) => {
  const { status, priority, source, assignedTo, search } = req.query;
  const { page, limit, skip } = buildPagination(req.query);
  const sort = buildSort(req.query, ["createdAt", "name", "status", "priority"]);

  const scope = await buildScopeFilter(req.user, "assignedTo");

  const filter = { ...scope, ...buildDateRangeFilter(req.query) };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (source) filter.source = source;
  // Admin/Manager can further narrow by a specific assignee within their scope
  if (assignedTo && req.user.role !== "Sales Executive") filter.assignedTo = assignedTo;
  if (search) filter.$text = { $search: search };

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(filter),
  ]);

  res.json(paginatedResponse(leads, total, page, limit));
});

// @route GET /api/leads/:id
export const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id)
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email")
    .populate("notes.createdBy", "name");

  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const allowed = await canAccessRecord(req.user, lead, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this lead");
  }

  res.json({ success: true, data: lead });
});

// @route POST /api/leads
export const createLead = asyncHandler(async (req, res) => {
  const { name, email, phone, company, source, priority, assignedTo } = req.body;

  if (!name || !source) {
    res.status(400);
    throw new Error("Name and source are required");
  }

  // Sales Executives can only assign leads to themselves on create
  let finalAssignee = req.user._id;
  if (req.user.role !== "Sales Executive" && assignedTo) {
    finalAssignee = assignedTo;
  }

  const lead = await Lead.create({
    name,
    email,
    phone,
    company,
    source,
    priority,
    assignedTo: finalAssignee,
    createdBy: req.user._id,
  });

  await logTimeline({
    kind: "Lead",
    item: lead._id,
    action: "created",
    description: `Lead created by ${req.user.name}`,
    performedBy: req.user._id,
  });

  if (finalAssignee.toString() !== req.user._id.toString()) {
    await notify({
      user: finalAssignee,
      type: "lead_assigned",
      message: `You were assigned a new lead: ${lead.name}`,
      link: `/leads/${lead._id}`,
    });
  }

  res.status(201).json({ success: true, data: lead });
});

// @route PUT /api/leads/:id
export const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const allowed = await canAccessRecord(req.user, lead, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this lead");
  }

  if (lead.isConverted) {
    res.status(400);
    throw new Error("Cannot edit a lead that has already been converted");
  }

  const editableFields = ["name", "email", "phone", "company", "priority"];
  const statusChanged = req.body.status && req.body.status !== lead.status;

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) lead[field] = req.body[field];
  });

  if (req.body.status) lead.status = req.body.status;

  await lead.save();

  if (statusChanged) {
    await logTimeline({
      kind: "Lead",
      item: lead._id,
      action: "status_changed",
      description: `Status changed to ${lead.status} by ${req.user.name}`,
      performedBy: req.user._id,
    });
  }

  res.json({ success: true, data: lead });
});

// @route PUT /api/leads/:id/assign  (assign/reassign — Sales Manager+ only, enforced in route)
export const assignLead = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  if (!assignedTo) {
    res.status(400);
    throw new Error("assignedTo is required");
  }

  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const allowed = await canAccessRecord(req.user, lead, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this lead");
  }

  const previousAssignee = lead.assignedTo;
  lead.assignedTo = assignedTo;
  await lead.save();

  await logTimeline({
    kind: "Lead",
    item: lead._id,
    action: "reassigned",
    description: `Lead reassigned by ${req.user.name}`,
    performedBy: req.user._id,
    meta: { from: previousAssignee, to: assignedTo },
  });

  await notify({
    user: assignedTo,
    type: "lead_assigned",
    message: `You were assigned lead: ${lead.name}`,
    link: `/leads/${lead._id}`,
  });

  res.json({ success: true, data: lead });
});

// @route POST /api/leads/:id/notes
export const addNote = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) {
    res.status(400);
    throw new Error("Note text is required");
  }

  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const allowed = await canAccessRecord(req.user, lead, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this lead");
  }

  lead.notes.push({ text, createdBy: req.user._id });
  await lead.save();

  res.status(201).json({ success: true, data: lead.notes[lead.notes.length - 1] });
});

// @route POST /api/leads/:id/convert
// Converts a qualified lead -> Customer + Deal in one atomic-ish operation.
// Guards against duplicate conversion (section 3).
export const convertLead = asyncHandler(async (req, res) => {
  const { dealTitle, dealValue, dealProbability, expectedClosingDate } = req.body;

  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    res.status(404);
    throw new Error("Lead not found");
  }

  const allowed = await canAccessRecord(req.user, lead, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this lead");
  }

  // Hard guard: prevent accidental duplicate conversion
  if (lead.isConverted) {
    res.status(400);
    throw new Error("This lead has already been converted");
  }

  if (!dealTitle || dealValue === undefined || !expectedClosingDate) {
    res.status(400);
    throw new Error("dealTitle, dealValue and expectedClosingDate are required to convert");
  }

  const customer = await Customer.create({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    sourceLead: lead._id,
    assignedTo: lead.assignedTo,
    createdBy: req.user._id,
  });

  const deal = await Deal.create({
    title: dealTitle,
    customer: customer._id,
    sourceLead: lead._id,
    value: dealValue,
    probability: dealProbability ?? 20,
    expectedClosingDate,
    assignedTo: lead.assignedTo,
    createdBy: req.user._id,
  });

  lead.isConverted = true;
  lead.status = "Converted";
  lead.convertedCustomer = customer._id;
  lead.convertedDeal = deal._id;
  lead.convertedAt = new Date();
  await lead.save();

  await Promise.all([
    logTimeline({
      kind: "Lead",
      item: lead._id,
      action: "converted",
      description: `Lead converted to customer & deal by ${req.user.name}`,
      performedBy: req.user._id,
    }),
    logTimeline({
      kind: "Customer",
      item: customer._id,
      action: "created",
      description: `Customer created from lead conversion by ${req.user.name}`,
      performedBy: req.user._id,
    }),
    logTimeline({
      kind: "Deal",
      item: deal._id,
      action: "created",
      description: `Deal created from lead conversion by ${req.user.name}`,
      performedBy: req.user._id,
    }),
  ]);

  res.status(201).json({ success: true, data: { lead, customer, deal } });
});
