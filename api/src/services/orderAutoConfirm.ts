import { prisma } from '../lib/prisma';
import { ORDER_STATUS } from '../constants/orderStatus';

const HOURS_48 = 48 * 60 * 60 * 1000;

export const autoConfirmDeliveredOrders = async () => {
  const cutoff = new Date(Date.now() - HOURS_48);
  const orders = await prisma.order.findMany({
    where: {
      status: ORDER_STATUS.DELIVERED,
      deliveredAt: { lte: cutoff },
      confirmedAt: null,
    },
  });
  for (const order of orders) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.COMPLETED, confirmedAt: new Date() },
    });
  }
  return orders.length;
};
