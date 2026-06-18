import { prisma } from '../lib/prisma';
import { AuthValidationError } from './authValidation';

export const addressService = {
  async list(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  },

  async create(userId: string, data: Record<string, unknown>) {
    const count = await prisma.address.count({ where: { userId } });
    const isDefault = count === 0 || Boolean(data.isDefault);
    if (isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.address.create({
      data: {
        userId,
        label: String(data.label || 'Rumah'),
        street: String(data.street),
        city: String(data.city),
        province: String(data.province),
        postalCode: String(data.postalCode),
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        isDefault,
      },
    });
  },

  async update(userId: string, id: string, data: Record<string, unknown>) {
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new AuthValidationError(404, 'Alamat tidak ditemukan');
    if (data.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const updateData: Record<string, unknown> = {};
    if (data.label !== undefined) updateData.label = String(data.label);
    if (data.street !== undefined) updateData.street = String(data.street);
    if (data.city !== undefined) updateData.city = String(data.city);
    if (data.province !== undefined) updateData.province = String(data.province);
    if (data.postalCode !== undefined) updateData.postalCode = String(data.postalCode);
    if (data.latitude !== undefined) updateData.latitude = Number(data.latitude);
    if (data.longitude !== undefined) updateData.longitude = Number(data.longitude);
    if (data.isDefault !== undefined) updateData.isDefault = Boolean(data.isDefault);

    return prisma.address.update({
      where: { id },
      data: updateData,
    });
  },

  async remove(userId: string, id: string) {
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new AuthValidationError(404, 'Alamat tidak ditemukan');
    await prisma.address.delete({ where: { id } });
    if (address.isDefault) {
      const next = await prisma.address.findFirst({ where: { userId } });
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  },

  async setDefault(userId: string, id: string) {
    const address = await prisma.address.findFirst({ where: { id, userId } });
    if (!address) throw new AuthValidationError(404, 'Alamat tidak ditemukan');
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return prisma.address.update({ where: { id }, data: { isDefault: true } });
  },
};
