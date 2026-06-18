import { prisma } from '../lib/prisma';
import { AuthValidationError } from './authValidation';
import { buildPaginated, parsePagination } from '../utils/pagination';

export const outletService = {
  async list(query: Record<string, string>) {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query, [
      'name',
      'city',
      'createdAt',
    ]);
    const where: Record<string, unknown> = {};
    if (query.city) where.city = { contains: query.city };
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
    const [items, total] = await Promise.all([
      prisma.outlet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { stations: true, _count: { select: { staff: true, orders: true } } },
      }),
      prisma.outlet.count({ where }),
    ]);
    return buildPaginated(items, total, page, limit);
  },

  async getActive() {
    return prisma.outlet.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        serviceRadiusKm: true,
      },
    });
  },

  async create(data: Record<string, unknown>) {
    return prisma.outlet.create({
      data: {
        name: String(data.name),
        address: String(data.address),
        city: String(data.city),
        province: String(data.province),
        postalCode: String(data.postalCode),
        phone: data.phone ? String(data.phone) : null,
        email: data.email ? String(data.email) : null,
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        serviceRadiusKm: data.serviceRadiusKm ? Number(data.serviceRadiusKm) : 15,
        openingHours: data.openingHours ? String(data.openingHours) : '08:00',
        closingHours: data.closingHours ? String(data.closingHours) : '21:00',
      },
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    const outlet = await prisma.outlet.findUnique({ where: { id } });
    if (!outlet) throw new AuthValidationError(404, 'Outlet tidak ditemukan');
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = String(data.name);
    if (data.address !== undefined) updateData.address = String(data.address);
    if (data.city !== undefined) updateData.city = String(data.city);
    if (data.province !== undefined) updateData.province = String(data.province);
    if (data.postalCode !== undefined) updateData.postalCode = String(data.postalCode);
    if (data.phone !== undefined) updateData.phone = String(data.phone);
    if (data.latitude !== undefined) updateData.latitude = Number(data.latitude);
    if (data.longitude !== undefined) updateData.longitude = Number(data.longitude);
    if (data.serviceRadiusKm !== undefined) updateData.serviceRadiusKm = Number(data.serviceRadiusKm);
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    return prisma.outlet.update({
      where: { id },
      data: updateData,
    });
  },
};
