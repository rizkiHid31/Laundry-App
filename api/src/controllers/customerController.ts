import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const getNearestOutlet = async (customerLat: number, customerLng: number) => {
  const outlets = await prisma.outlet.findMany({ where: { isActive: true } });

  let nearest = outlets[0];
  let shortest = Number.POSITIVE_INFINITY;

  for (const outlet of outlets) {
    const lat = Number(outlet.latitude);
    const lng = Number(outlet.longitude);
    const distance = Math.sqrt(Math.pow(lat - customerLat, 2) + Math.pow(lng - customerLng, 2));
    if (distance < shortest) {
      shortest = distance;
      nearest = outlet;
    }
  }

  return nearest;
};

export const getCustomerOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const orders = await prisma.order.findMany({
      where: { pickupRequest: { customerId: req.user.userId } },
      include: {
        pickupRequest: {
          include: {
            address: true,
            outlet: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('getCustomerOrders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

export const getLaundryItems = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.laundryItem.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('getLaundryItems error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch laundry items' });
  }
};

export const getCustomerOrderById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, pickupRequest: { customerId: req.user.userId } },
      include: {
        pickupRequest: {
          include: {
            address: true,
            outlet: true,
          },
        },
        orderItems: {
          include: {
            laundryItem: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('getCustomerOrderById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch order details' });
  }
};

export const createCustomerOrder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { addressId, scheduledAt, items, totalKg, serviceType, note } = req.body as {
      addressId?: string;
      scheduledAt?: string;
      items?: Array<{ laundryItemId: string; quantity: number }>;
      totalKg?: number;
      serviceType?: 'regular' | 'express' | 'premium';
      note?: string;
    };

    if (!addressId || !scheduledAt || !items?.length || !totalKg || !serviceType) {
      return res.status(400).json({ success: false, message: 'Please provide address, schedule, service, items, and total weight' });
    }

    const address = await prisma.address.findFirst({ where: { id: addressId, userId: req.user.userId } });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const outlet = await getNearestOutlet(Number(address.latitude), Number(address.longitude));
    if (!outlet) {
      return res.status(404).json({ success: false, message: 'No active outlet found' });
    }

    const employee = await prisma.outletEmployee.findFirst({ where: { outletId: outlet.id, isActive: true } });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'No outlet admin available' });
    }

    const pickupRequest = await prisma.pickupRequest.create({
      data: {
        customerId: req.user.userId,
        addressId: address.id,
        outletId: outlet.id,
        scheduledAt: new Date(scheduledAt),
        status: 'WAITING_DRIVER',
      },
    });

    const serviceRates: Record<string, number> = {
      regular: 5000,
      express: 7500,
      premium: 10000,
    };

    const rate = serviceRates[serviceType] ?? 5000;
    const totalPrice = Number(totalKg) * rate;

    const order = await prisma.order.create({
      data: {
        invoiceNumber: `INV-${Date.now()}`,
        pickupRequestId: pickupRequest.id,
        outletId: outlet.id,
        outletAdminId: employee.id,
        totalKg: totalKg,
        totalPrice,
        status: 'PROCESSING',
      },
    });

    await prisma.orderItem.createMany({
      data: items.map((item) => ({
        orderId: order.id,
        laundryItemId: item.laundryItemId,
        quantity: item.quantity,
        pricePerUnit: rate,
      })),
    });

    if (note) {
      await prisma.notification.create({
        data: { userId: req.user.userId, orderId: order.id, type: 'ORDER_CREATED', message: note },
      });
    }
    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    console.error('createCustomerOrder error:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};
