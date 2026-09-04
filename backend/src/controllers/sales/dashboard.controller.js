import asyncHandler from "express-async-handler";
import Lead from "../../models/Lead.js";
import Customer from "../../models/Customer.js";
import Deal from "../../models/Deal.js";
import Activity from "../../models/Activity.js";
import User from "../../models/User.js";
import { buildScopeFilter } from "../../middleware/scope.js";

// @route GET /api/dashboard
// Single endpoint returning everything in section 6's metrics table, scoped to the
// requesting user's role (Sales Executive: own numbers, Manager: team, Admin: all).
export const getDashboard = asyncHandler(async (req, res) => {
  const leadScope = await buildScopeFilter(req.user, "assignedTo");
  const dealScope = await buildScopeFilter(req.user, "assignedTo");
  const activityScope = await buildScopeFilter(req.user, "assignedTo");

  const [
    totalLeads,
    newLeads,
    qualifiedLeads,
    convertedLeads,
    lostLeads,
    totalCustomers,
    newCustomers30d,
    dealStageCounts,
    dealAgg,
    pendingFollowups,
    completedFollowups,
    overdueFollowups,
  ] = await Promise.all([
    Lead.countDocuments(leadScope),
    Lead.countDocuments({ ...leadScope, status: "New" }),
    Lead.countDocuments({ ...leadScope, status: "Qualified" }),
    Lead.countDocuments({ ...leadScope, isConverted: true }),
    Lead.countDocuments({ ...leadScope, status: { $in: ["Lost", "Unqualified"] } }),
    Customer.countDocuments(await buildScopeFilter(req.user, "assignedTo")),
    Customer.countDocuments({
      ...(await buildScopeFilter(req.user, "assignedTo")),
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
    Deal.aggregate([
      { $match: dealScope },
      { $group: { _id: "$stage", count: { $sum: 1 }, totalValue: { $sum: "$value" } } },
    ]),
    Deal.aggregate([
      { $match: dealScope },
      {
        $group: {
          _id: null,
          totalDeals: { $sum: 1 },
          openDeals: { $sum: { $cond: [{ $eq: ["$isClosed", false] }, 1, 0] } },
          wonDeals: { $sum: { $cond: [{ $eq: ["$stage", "Won"] }, 1, 0] } },
          lostDeals: { $sum: { $cond: [{ $eq: ["$stage", "Lost"] }, 1, 0] } },
          pipelineValue: {
            $sum: { $cond: [{ $eq: ["$isClosed", false] }, "$value", 0] },
          },
          wonRevenue: { $sum: { $cond: [{ $eq: ["$stage", "Won"] }, "$value", 0] } },
          expectedRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$isClosed", false] },
                { $divide: [{ $multiply: ["$value", "$probability"] }, 100] },
                0,
              ],
            },
          },
        },
      },
    ]),
    Activity.countDocuments({ ...activityScope, status: "Pending" }),
    Activity.countDocuments({ ...activityScope, status: "Completed" }),
    Activity.countDocuments({ ...activityScope, status: "Overdue" }),
  ]);

  const dealTotals = dealAgg[0] || {
    totalDeals: 0,
    openDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    pipelineValue: 0,
    wonRevenue: 0,
    expectedRevenue: 0,
  };

  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;

  let teamPerformance = null;
  if (req.user.role === "Admin" || req.user.role === "Sales Manager") {
    const teamFilter =
      req.user.role === "Admin" ? {} : { manager: req.user._id };
    const teamUsers = await User.find(teamFilter).select("_id name role").lean();
    const teamIds = teamUsers.map((u) => u._id);

    const perUser = await Deal.aggregate([
      { $match: { assignedTo: { $in: teamIds } } },
      {
        $group: {
          _id: "$assignedTo",
          totalDeals: { $sum: 1 },
          wonDeals: { $sum: { $cond: [{ $eq: ["$stage", "Won"] }, 1, 0] } },
          wonRevenue: { $sum: { $cond: [{ $eq: ["$stage", "Won"] }, "$value", 0] } },
        },
      },
    ]);

    const perUserMap = Object.fromEntries(perUser.map((p) => [p._id.toString(), p]));

    teamPerformance = teamUsers.map((u) => ({
      user: { id: u._id, name: u.name, role: u.role },
      totalDeals: perUserMap[u._id.toString()]?.totalDeals || 0,
      wonDeals: perUserMap[u._id.toString()]?.wonDeals || 0,
      wonRevenue: perUserMap[u._id.toString()]?.wonRevenue || 0,
    }));
  }

  res.json({
    success: true,
    data: {
      leads: {
        total: totalLeads,
        new: newLeads,
        qualified: qualifiedLeads,
        converted: convertedLeads,
        lost: lostLeads,
        conversionRate,
      },
      customers: {
        total: totalCustomers,
        newLast30Days: newCustomers30d,
      },
      deals: {
        ...dealTotals,
        expectedRevenue: Math.round(dealTotals.expectedRevenue || 0),
        pipelineByStage: dealStageCounts,
      },
      activities: {
        pending: pendingFollowups,
        completed: completedFollowups,
        overdue: overdueFollowups,
      },
      teamPerformance,
    },
  });
});
