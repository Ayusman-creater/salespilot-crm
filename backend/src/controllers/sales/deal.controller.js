import asyncHandler from "express-async-handler";
import Deal, { VALID_TRANSITIONS } from "../../models/Deal.js";
import { buildScopeFilter, canAccessRecord } from "../../middleware/scope.js";
import { buildPagination, buildSort, buildDateRangeFilter, paginatedResponse } from "../../utils/queryHelper.js";
import { logTimeline } from "../../utils/logTimeline.js";
import { notify } from "../../utils/notify.js";

// @route GET /api/deals
export const getDeals = asyncHandler(async (req, res) => {
  const { stage, assignedTo, minAmount, maxAmount } = req.query;
  const { page, limit, skip } = buildPagination(req.query);
  const sort = buildSort(req.query, ["createdAt", "value", "expectedClosingDate", "stage"]);

  const scope = await buildScopeFilter(req.user, "assignedTo");
  const filter = { ...scope, ...buildDateRangeFilter(req.query, "expectedClosingDate") };
  if (stage) filter.stage = stage;
  if (assignedTo && req.user.role !== "Sales Executive") filter.assignedTo = assignedTo;
  if (minAmount || maxAmount) {
    filter.value = {};
    if (minAmount) filter.value.$gte = Number(minAmount);
    if (maxAmount) filter.value.$lte = Number(maxAmount);
  }

  const [deals, total] = await Promise.all([
    Deal.find(filter)
      .populate("assignedTo", "name email role")
      .populate("customer", "name email company")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Deal.countDocuments(filter),
  ]);

  res.json(paginatedResponse(deals, total, page, limit));
});

// @route GET /api/deals/:id
export const getDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id)
    .populate("assignedTo", "name email role")
    .populate("customer", "name email company")
    .populate("sourceLead", "name source");

  if (!deal) {
    res.status(404);
    throw new Error("Deal not found");
  }

  const allowed = await canAccessRecord(req.user, deal, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this deal");
  }

  res.json({ success: true, data: deal });
});

// @route PUT /api/deals/:id
export const updateDeal = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error("Deal not found");
  }

  const allowed = await canAccessRecord(req.user, deal, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this deal");
  }

  if (deal.isClosed) {
    res.status(400);
    throw new Error("Cannot edit a closed deal (Won/Lost)");
  }

  const { title, value, probability, expectedClosingDate } = req.body;

  if (value !== undefined) {
    if (value < 0) {
      res.status(400);
      throw new Error("Deal value cannot be negative");
    }
    deal.value = value;
  }
  if (probability !== undefined) {
    if (probability < 0 || probability > 100) {
      res.status(400);
      throw new Error("Probability must be between 0 and 100");
    }
    deal.probability = probability;
  }
  if (title) deal.title = title;
  if (expectedClosingDate) deal.expectedClosingDate = expectedClosingDate;

  await deal.save();
  res.json({ success: true, data: deal });
});

// @route PUT /api/deals/:id/stage
// Enforces the pipeline's valid stage transitions (section 4) on the BACKEND —
// frontend can guide the user, but this is the actual rule enforcement.
export const updateDealStage = asyncHandler(async (req, res) => {
  const { stage } = req.body;
  if (!stage) {
    res.status(400);
    throw new Error("stage is required");
  }

  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error("Deal not found");
  }

  const allowed = await canAccessRecord(req.user, deal, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this deal");
  }

  if (deal.isClosed) {
    res.status(400);
    throw new Error(`Deal is already closed (${deal.stage}) and cannot be moved further`);
  }

  const allowedNextStages = VALID_TRANSITIONS[deal.stage] || [];
  if (!allowedNextStages.includes(stage)) {
    res.status(400);
    throw new Error(
      `Invalid stage transition: cannot move from '${deal.stage}' to '${stage}'. Valid next stages: ${
        allowedNextStages.join(", ") || "none (terminal stage)"
      }`
    );
  }

  const previousStage = deal.stage;
  deal.stage = stage;

  if (stage === "Won" || stage === "Lost") {
    deal.isClosed = true;
    deal.closedAt = new Date();
    deal.probability = stage === "Won" ? 100 : 0;
  }

  await deal.save();

  await logTimeline({
    kind: "Deal",
    item: deal._id,
    action: "stage_changed",
    description: `Stage moved from ${previousStage} to ${stage} by ${req.user.name}`,
    performedBy: req.user._id,
  });

  if (stage === "Won" || stage === "Lost") {
    await logTimeline({
      kind: "Deal",
      item: deal._id,
      action: "closed",
      description: `Deal closed as ${stage} by ${req.user.name}`,
      performedBy: req.user._id,
    });
    if (deal.assignedTo) {
      await notify({
        user: deal.assignedTo,
        type: "deal_closed",
        message: `Deal "${deal.title}" was closed as ${stage}`,
        link: `/deals/${deal._id}`,
      });
    }
  }

  res.json({ success: true, data: deal });
});
