import { prisma } from '../lib/prisma';
import { findNearestOutlet } from '../utils/geo';
import { ORDER_STATUS } from '../constants/orderStatus';
import { AuthValidationError } from './authValidation';
import { generateInvoiceNumber } from '../utils/invoice';

const getActiveOutlets = async () => {
  return prisma.outlet.findMany({ where: { isActive: true } });
};

const assignOutlet = async (lat: number, lng: number) => {
  const outlets = await getActiveOutlets();
  const nearest = findNearestOutlet(outlets, lat, lng);
  if (!nearest) {
    throw new AuthValidationError(400, 'Tidak ada outlet dalam jangkauan layanan');
  }
  return nearest;
};

export const pickupService = {
  async create(userId: string, data: Record<string, unknown>) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.isVerified) {
      throw new AuthValidationError(403, 'Verifikasi email diperlukan untuk membuat pickup');
    }
    const address = await prisma.address.findFirst({
      where: { id: String(data.addressId), userId },
    });
    if (!address?.latitude || !address.longitude) {
      throw new AuthValidationError(
        400,
        'Alamat belum memiliki koordinat. Edit alamat dan izinkan akses lokasi.'
      );
    }
    const outlet = await assignOutlet(address.latitude, address.longitude);
    const invoiceNumber = generateInvoiceNumber();
    const order = await prisma.order.create({
      data: {
        invoiceNumber,
        userId,
        outletId: outlet.id,
        status: ORDER_STATUS.WAITING_DRIVER_PICKUP,
        totalKilo: 0,
        totalPrice: 0,
      },
    });
    const pickup = await prisma.pickupRequest.create({
      data: {
        userId,
        addressId: address.id,
        outletId: outlet.id,
        orderId: order.id,
        requestType: 'PICKUP',
        pickupAddress: address.street,
        pickupCity: address.city,
        pickupProvince: address.province,
        pickupPostalCode: address.postalCode,
        latitude: address.latitude,
        longitude: address.longitude,
        estimatedPickupTime: data.scheduledAt ? new Date(String(data.scheduledAt)) : null,
        notes: data.notes ? String(data.notes) : null,
        status: ORDER_STATUS.WAITING_DRIVER_PICKUP,
      },
      include: { outlet: true, order: true },
    });
    return pickup;
  },

  async listForCustomer(userId: string, query: Record<string, string>) {
    const where: Record<string, unknown> = { userId };
    if (query.status) where.status = query.status;
    return prisma.pickupRequest.findMany({
      where,
      include: { outlet: true, order: true, driver: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async listForDriver(driverUserId: string, outletId?: string) {
    const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new AuthValidationError(404, 'Profil driver tidak ditemukan');
    const oid = outletId || driver.outletId;
    const [active, available] = await Promise.all([
      prisma.pickupRequest.findMany({
        where: {
          driverId: driver.id,
          requestType: 'PICKUP',
          status: {
            notIn: [ORDER_STATUS.ARRIVED_AT_OUTLET, ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED],
          },
        },
        include: { user: true, order: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.pickupRequest.findMany({
        where: {
          outletId: oid,
          requestType: 'PICKUP',
          status: ORDER_STATUS.WAITING_DRIVER_PICKUP,
          driverId: null,
        },
        include: { user: true, order: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    return [...active, ...available];
  },

  async acceptPickup(driverUserId: string, pickupId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new AuthValidationError(404, 'Profil driver tidak ditemukan');
    if (driver.isBusy) {
      throw new AuthValidationError(400, 'Selesaikan order aktif terlebih dahulu');
    }
    const pickup = await prisma.pickupRequest.findUnique({ where: { id: pickupId } });
    if (!pickup || pickup.driverId) {
      throw new AuthValidationError(400, 'Pickup tidak tersedia');
    }
    await prisma.driver.update({
      where: { id: driver.id },
      data: { isBusy: true, currentOrderId: pickup.orderId },
    });
    return prisma.pickupRequest.update({
      where: { id: pickupId },
      data: { driverId: driver.id },
      include: { order: true, user: true },
    });
  },

  async markPickedUp(driverUserId: string, pickupId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver?.id) throw new AuthValidationError(404, 'Driver tidak ditemukan');
    const pickup = await prisma.pickupRequest.findFirst({
      where: { id: pickupId, driverId: driver.id },
      include: { order: true },
    });
    if (!pickup?.orderId) throw new AuthValidationError(404, 'Pickup tidak ditemukan');
    await prisma.order.update({
      where: { id: pickup.orderId },
      data: { status: ORDER_STATUS.LAUNDRY_TO_OUTLET },
    });
    return prisma.pickupRequest.update({
      where: { id: pickupId },
      data: {
        status: ORDER_STATUS.LAUNDRY_TO_OUTLET,
        actualPickupTime: new Date(),
      },
    });
  },

  async markArrivedAtOutlet(driverUserId: string, pickupId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver?.id) throw new AuthValidationError(404, 'Driver tidak ditemukan');
    const pickup = await prisma.pickupRequest.findFirst({
      where: { id: pickupId, driverId: driver.id },
      include: { order: true },
    });
    if (!pickup?.orderId) throw new AuthValidationError(404, 'Pickup tidak ditemukan');
    await prisma.order.update({
      where: { id: pickup.orderId },
      data: { status: ORDER_STATUS.ARRIVED_AT_OUTLET },
    });
    await prisma.driver.update({
      where: { id: driver!.id },
      data: { isBusy: false, currentOrderId: null },
    });
    return prisma.pickupRequest.update({
      where: { id: pickupId },
      data: { status: ORDER_STATUS.ARRIVED_AT_OUTLET },
    });
  },
};
