import { prisma } from '../lib/prisma';
import { ORDER_STATUS } from '../constants/orderStatus';
import { AuthValidationError } from './authValidation';

export const paymentService = {
  async listDeliveries(driverUserId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new AuthValidationError(404, 'Driver tidak ditemukan');
    const [active, available] = await Promise.all([
      prisma.pickupRequest.findMany({
        where: {
          driverId: driver.id,
          requestType: 'DELIVERY',
          status: ORDER_STATUS.DELIVERING,
        },
        include: { order: true, user: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.pickupRequest.findMany({
        where: {
          outletId: driver.outletId,
          requestType: 'DELIVERY',
          status: ORDER_STATUS.READY_FOR_DELIVERY,
          driverId: null,
        },
        include: { order: true, user: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    return [...active, ...available];
  },

  async createPayment(userId: string, orderId: string, method: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: { in: [ORDER_STATUS.WAITING_PAYMENT, ORDER_STATUS.READY_FOR_DELIVERY] },
      },
    });
    if (!order) throw new AuthValidationError(404, 'Order tidak dapat dibayar');
    if (order.isPaid) throw new AuthValidationError(400, 'Order sudah dibayar');
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        userId,
        amount: order.totalPrice,
        method,
        status: 'PENDING',
        transactionId: `TXN-${Date.now()}`,
      },
    });
    return { payment, snapToken: `mock-snap-${payment.id}` };
  },

  async confirmPayment(userId: string, paymentId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId },
      include: { order: true },
    });
    if (!payment?.order) throw new AuthValidationError(404, 'Pembayaran tidak ditemukan');
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'COMPLETED', paymentDate: new Date() },
    });
    const order = await prisma.order.update({
      where: { id: payment.orderId! },
      data: {
        isPaid: true,
        paymentMethod: payment.method,
        status: ORDER_STATUS.READY_FOR_DELIVERY,
      },
    });
    await this.createDeliveryRequest(order.id, order.outletId!);
    return order;
  },

  async createDeliveryRequest(orderId: string, outletId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { include: { addresses: { where: { isDefault: true } } } } },
    });
    if (!order) return;
    const addr = order.user.addresses[0];
    if (!addr) return;
    await prisma.pickupRequest.create({
      data: {
        userId: order.userId,
        addressId: addr.id,
        outletId,
        orderId: order.id,
        requestType: 'DELIVERY',
        pickupAddress: addr.street,
        pickupCity: addr.city,
        pickupProvince: addr.province,
        pickupPostalCode: addr.postalCode,
        latitude: addr.latitude,
        longitude: addr.longitude,
        status: ORDER_STATUS.READY_FOR_DELIVERY,
      },
    });
  },

  async acceptDelivery(driverUserId: string, pickupId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver) throw new AuthValidationError(404, 'Driver tidak ditemukan');
    if (driver.isBusy) throw new AuthValidationError(400, 'Selesaikan order aktif dulu');
    const pickup = await prisma.pickupRequest.findFirst({
      where: { id: pickupId, requestType: 'DELIVERY', driverId: null },
      include: { order: true },
    });
    if (!pickup?.order?.isPaid) {
      throw new AuthValidationError(400, 'Order belum dibayar');
    }
    await prisma.driver.update({
      where: { id: driver.id },
      data: { isBusy: true, currentOrderId: pickup.orderId },
    });
    await prisma.order.update({
      where: { id: pickup.orderId! },
      data: { status: ORDER_STATUS.DELIVERING, deliveryDriverId: driver.id },
    });
    return prisma.pickupRequest.update({
      where: { id: pickupId },
      data: { driverId: driver.id, status: ORDER_STATUS.DELIVERING },
    });
  },

  async completeDelivery(driverUserId: string, pickupId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId: driverUserId } });
    if (!driver?.id) throw new AuthValidationError(404, 'Driver tidak ditemukan');
    const pickup = await prisma.pickupRequest.findFirst({
      where: { id: pickupId, driverId: driver.id, requestType: 'DELIVERY' },
    });
    if (!pickup?.orderId) throw new AuthValidationError(404, 'Delivery tidak ditemukan');
    await prisma.order.update({
      where: { id: pickup.orderId },
      data: { status: ORDER_STATUS.DELIVERED, deliveredAt: new Date() },
    });
    await prisma.driver.update({
      where: { id: driver!.id },
      data: { isBusy: false, currentOrderId: null },
    });
    return prisma.pickupRequest.update({
      where: { id: pickupId },
      data: { status: ORDER_STATUS.DELIVERED },
    });
  },
};
