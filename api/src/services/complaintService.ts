import { prisma } from '../lib/prisma';
import { AuthValidationError } from './authValidation';
import { buildPaginated, parsePagination } from '../utils/pagination';

export const complaintService = {
  async create(userId: string, data: Record<string, unknown>) {
    const order = await prisma.order.findFirst({
      where: {
        id: String(data.orderId),
        userId,
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
    });
    if (!order) throw new AuthValidationError(404, 'Order tidak ditemukan');
    return prisma.complaint.create({
      data: {
        orderId: order.id,
        userId,
        type: String(data.type),
        description: String(data.description),
      },
    });
  },

  async listForCustomer(userId: string, query: Record<string, string>) {
    const { page, limit, skip } = parsePagination(query, ['createdAt']);
    const where = { userId };
    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: { order: { select: { invoiceNumber: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaint.count({ where }),
    ]);
    return buildPaginated(items, total, page, limit);
  },

  async listAll(query: Record<string, string>) {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, [
      'createdAt',
      'status',
    ]);
    const where = query.status ? { status: query.status } : {};
    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          order: { select: { invoiceNumber: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.complaint.count({ where }),
    ]);
    return buildPaginated(items, total, page, limit);
  },

  async respond(id: string, response: string) {
    return prisma.complaint.update({
      where: { id },
      data: { response, status: 'RESOLVED' },
    });
  },
};
