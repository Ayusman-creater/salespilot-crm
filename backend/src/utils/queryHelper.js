// Shared helper so every list endpoint (leads/customers/deals) handles
// pagination, sorting and date-range filters the same way (section 7).
export const buildPagination = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit) || 10, 1), 100); // cap at 100/page
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildSort = (query, allowedFields = [], defaultSort = "-createdAt") => {
  if (!query.sortBy) return defaultSort;
  const direction = query.sortOrder === "asc" ? "" : "-";
  if (!allowedFields.includes(query.sortBy)) return defaultSort;
  return `${direction}${query.sortBy}`;
};

export const buildDateRangeFilter = (query, field = "createdAt") => {
  const filter = {};
  if (query.dateFrom || query.dateTo) {
    filter[field] = {};
    if (query.dateFrom) filter[field].$gte = new Date(query.dateFrom);
    if (query.dateTo) filter[field].$lte = new Date(query.dateTo);
  }
  return filter;
};

export const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
});
