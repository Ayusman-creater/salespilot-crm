import User from "../models/User.js";

/**
 * Row-level access control. Route-level `authorize()` only checks "can this role
 * hit this endpoint at all" — this decides "which documents can this specific user see".
 *
 * - Admin: sees everything, no filter applied.
 * - Sales Manager: sees their own records + records of Sales Executives who report to them.
 * - Sales Executive: sees only records assigned to themselves.
 *
 * Returns a Mongo filter fragment to merge into the route's query, e.g.
 *   const scope = await buildScopeFilter(req.user, "assignedTo");
 *   Lead.find({ ...otherFilters, ...scope })
 */
export const buildScopeFilter = async (user, field = "assignedTo") => {
  if (user.role === "Admin") return {};

  if (user.role === "Sales Manager") {
    const reports = await User.find({ manager: user._id }).select("_id").lean();
    const teamIds = [user._id, ...reports.map((r) => r._id)];
    return { [field]: { $in: teamIds } };
  }

  // Sales Executive: only their own assigned records
  return { [field]: user._id };
};

// Checks a single already-fetched document against the same rules (for GET/PUT by :id routes)
export const canAccessRecord = async (user, record, field = "assignedTo") => {
  if (user.role === "Admin") return true;

  const ownerId = record[field]?.toString();

  if (user.role === "Sales Manager") {
    if (ownerId === user._id.toString()) return true;
    const reports = await User.find({ manager: user._id }).select("_id").lean();
    return reports.some((r) => r._id.toString() === ownerId);
  }

  // Sales Executive
  return ownerId === user._id.toString();
};
