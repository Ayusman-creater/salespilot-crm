import asyncHandler from "express-async-handler";
import Customer from "../../models/Customer.js";
import Deal from "../../models/Deal.js";
import { buildScopeFilter, canAccessRecord } from "../../middleware/scope.js";
import { buildPagination, buildSort, buildDateRangeFilter, paginatedResponse } from "../../utils/queryHelper.js";

// @route GET /api/customers
export const getCustomers = asyncHandler(async (req, res) => {
  const { assignedTo, search, dealStatus } = req.query;
  const { page, limit, skip } = buildPagination(req.query);
  const sort = buildSort(req.query, ["createdAt", "name"]);

  const scope = await buildScopeFilter(req.user, "assignedTo");
  const filter = { ...scope, ...buildDateRangeFilter(req.query) };
  if (assignedTo && req.user.role !== "Sales Executive") filter.assignedTo = assignedTo;
  if (search) filter.$text = { $search: search };

  let customers = await Customer.find(filter)
    .populate("assignedTo", "name email role")
    .populate("sourceLead", "name source")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Customer.countDocuments(filter);

  // Optional: filter by related deal status (requires a lookup pass since deals aren't embedded)
  if (dealStatus) {
    const customerIds = customers.map((c) => c._id);
    const deals = await Deal.find({
      customer: { $in: customerIds },
      ...(dealStatus === "Won" || dealStatus === "Lost"
        ? { stage: dealStatus }
        : { isClosed: false }),
    })
      .select("customer")
      .lean();
    const matchingIds = new Set(deals.map((d) => d.customer.toString()));
    customers = customers.filter((c) => matchingIds.has(c._id.toString()));
  }

  res.json(paginatedResponse(customers, total, page, limit));
});

// @route GET /api/customers/:id
export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id)
    .populate("assignedTo", "name email role")
    .populate("sourceLead", "name source status");

  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  const allowed = await canAccessRecord(req.user, customer, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this customer");
  }

  const deals = await Deal.find({ customer: customer._id }).sort("-createdAt");

  res.json({ success: true, data: { customer, deals } });
});

// @route PUT /api/customers/:id
export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }

  const allowed = await canAccessRecord(req.user, customer, "assignedTo");
  if (!allowed) {
    res.status(403);
    throw new Error("You do not have access to this customer");
  }

  const editableFields = ["name", "email", "phone", "company"];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) customer[field] = req.body[field];
  });

  await customer.save();
  res.json({ success: true, data: customer });
});
