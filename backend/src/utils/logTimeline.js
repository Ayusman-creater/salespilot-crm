import TimelineEvent from "../models/TimelineEvent.js";

export const logTimeline = async ({ kind, item, action, description, performedBy, meta = {} }) => {
  try {
    await TimelineEvent.create({
      relatedTo: { kind, item },
      action,
      description,
      performedBy,
      meta,
    });
  } catch (err) {
    // Timeline logging should never break the primary operation
    console.error("Timeline log failed:", err.message);
  }
};
