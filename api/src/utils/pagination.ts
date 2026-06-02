export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const getPaginationParams = (
  query: Record<string, unknown>
): PaginationParams => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  return { page, limit };
};

export const buildPaginationMeta = (
  total: number,
  { page, limit }: PaginationParams
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

export const getPrismaSkip = ({ page, limit }: PaginationParams): number =>
  (page - 1) * limit;
