export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const parsePagination = (query: PaginationQuery, allowedSort: string[]) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const sortBy = allowedSort.includes(query.sortBy || '') ? query.sortBy! : 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  return { page, limit, skip: (page - 1) * limit, sortBy, sortOrder };
};

export const buildPaginated = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> => ({
  items,
  pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
});
