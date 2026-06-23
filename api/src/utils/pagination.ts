export const getPagination = (query: Record<string, unknown>) => {
  const page = Math.max(1, parseInt(query['page'] as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query['limit'] as string) || 10));
  return { page, limit, skip: (page - 1) * limit };
};
