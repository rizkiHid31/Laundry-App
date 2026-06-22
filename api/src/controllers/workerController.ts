import { Response } from 'express';
import { StationStatus, StationName, OrderStatus, BypassStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { EmployeeRequest } from '../middleware/employeeGuard';

const getPagination = (query: Record<string, unknown>) => {
  const page = Math.max(1, parseInt(query['page'] as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query['limit'] as string) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const stationOrderStatus: Record<StationName, OrderStatus> = {
  WASHING: OrderStatus.WASHING,
  IRONING: OrderStatus.IRONING,
  PACKING: OrderStatus.PACKING,
};

const nextStation: Partial<Record<StationName, StationName>> = {
  WASHING: StationName.IRONING,
  IRONING: StationName.PACKING,
};

type ItemInput = { laundryItemId: string; quantityInput: number };

const checkMismatch = (inputs: ItemInput[], references: ItemInput[]) => {
  return references.filter((ref) => {
    const found = inputs.find((i) => i.laundryItemId === ref.laundryItemId);
    return !found || found.quantityInput !== ref.quantityInput;
  });
};

export const getMyOrders = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { outletId } = req.employee!;
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
    const station = req.query['station'] as StationName | undefined;

    const where = {
      order: { outletId },
      status: { in: [StationStatus.PENDING, StationStatus.IN_PROGRESS] as StationStatus[] },
      ...(station ? { station } : {}),
    };

    const [stations, total] = await prisma.$transaction([
      prisma.orderStation.findMany({
        where,
        include: {
          order: {
            include: {
              orderItems: { include: { laundryItem: { select: { name: true, unit: true } } } },
              pickupRequest: { select: { scheduledAt: true, customer: { select: { name: true } } } },
            },
          },
          worker: { select: { user: { select: { name: true } } } },
        },
        orderBy: { order: { createdAt: 'asc' } },
        skip,
        take: limit,
      }),
      prisma.orderStation.count({ where }),
    ]);

    res.json({ success: true, data: stations, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
};

export const startStation = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: workerId } = req.employee!;
    const { stationId } = req.params as { stationId: string };

    const station = await prisma.orderStation.findUnique({ where: { id: stationId } });
    if (!station || station.status !== StationStatus.PENDING) {
      res.status(400).json({ success: false, message: 'Station tidak tersedia' });
      return;
    }

    const updated = await prisma.orderStation.update({
      where: { id: stationId },
      data: { workerId, status: StationStatus.IN_PROGRESS, startedAt: new Date() },
    });

    res.json({ success: true, message: 'Mulai mengerjakan', data: updated });
  } catch (error) {
    console.error('startStation error:', error);
    res.status(500).json({ success: false, message: 'Gagal memulai station' });
  }
};

export const completeStation = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: workerId } = req.employee!;
    const { stationId } = req.params as { stationId: string };
    const { items } = req.body as { items: ItemInput[] };

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: 'Item wajib diisi' });
      return;
    }

    const station = await prisma.orderStation.findUnique({
      where: { id: stationId },
      include: {
        order: {
          include: {
            orderItems: true,
            orderStations: { include: { stationItems: true } },
            payment: true,
          },
        },
      },
    });

    if (!station || station.workerId !== workerId || station.status !== StationStatus.IN_PROGRESS) {
      res.status(400).json({ success: false, message: 'Station tidak valid' });
      return;
    }

    // Tentukan referensi item dari station sebelumnya
    let referenceItems: ItemInput[];
    if (station.station === StationName.WASHING) {
      referenceItems = station.order.orderItems.map((i) => ({
        laundryItemId: i.laundryItemId,
        quantityInput: i.quantity,
      }));
    } else {
      const prevStation = station.station === StationName.IRONING ? StationName.WASHING : StationName.IRONING;
      const prev = station.order.orderStations.find((s) => s.station === prevStation);
      referenceItems = (prev?.stationItems ?? []).map((i) => ({
        laundryItemId: i.laundryItemId,
        quantityInput: i.quantityInput,
      }));
    }

    const mismatches = checkMismatch(items, referenceItems);
    if (mismatches.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Jumlah item tidak sesuai. Buat bypass request untuk melanjutkan.',
        mismatches,
      });
      return;
    }

    // Semua cocok — simpan StationItems dan selesaikan
    const isPaid = station.order.payment?.status === 'PAID';
    const next = nextStation[station.station];

    await prisma.$transaction(async (tx) => {
      // Hapus item lama jika ada, lalu buat baru
      await tx.stationItem.deleteMany({ where: { stationId } });
      await tx.stationItem.createMany({
        data: items.map((i) => ({ stationId, laundryItemId: i.laundryItemId, quantityInput: i.quantityInput })),
      });

      await tx.orderStation.update({
        where: { id: stationId },
        data: { status: StationStatus.COMPLETED, completedAt: new Date() },
      });

      if (station.station === StationName.PACKING) {
        // Packing selesai: cek pembayaran
        const newOrderStatus = isPaid ? OrderStatus.READY_TO_DELIVER : OrderStatus.WAITING_PAYMENT;
        await tx.order.update({ where: { id: station.orderId }, data: { status: newOrderStatus } });

        if (isPaid) {
          // Buat delivery request otomatis
          const pickupReq = await tx.pickupRequest.findUnique({
            where: { id: station.order.pickupRequestId },
          });
          if (pickupReq) {
            await tx.deliveryRequest.create({
              data: {
                orderId: station.orderId,
                outletId: station.order.outletId,
                addressId: pickupReq.addressId,
                status: 'WAITING_DRIVER',
              },
            });
          }
        }
      } else if (next) {
        await tx.order.update({
          where: { id: station.orderId },
          data: { status: stationOrderStatus[next] },
        });
        await tx.orderStation.update({
          where: { orderId_station: { orderId: station.orderId, station: next } },
          data: { status: StationStatus.PENDING },
        });
      }
    });

    res.json({ success: true, message: 'Station selesai' });
  } catch (error) {
    console.error('completeStation error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyelesaikan station' });
  }
};

export const requestBypass = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { stationId } = req.params as { stationId: string };
    const { reason } = req.body as { reason: string };

    if (!reason || reason.trim().length < 10) {
      res.status(400).json({ success: false, message: 'Alasan minimal 10 karakter' });
      return;
    }

    const station = await prisma.orderStation.findUnique({ where: { id: stationId } });
    if (!station || station.status !== StationStatus.IN_PROGRESS) {
      res.status(400).json({ success: false, message: 'Station tidak valid' });
      return;
    }

    const existing = await prisma.bypassRequest.findFirst({
      where: { stationId, status: BypassStatus.PENDING },
    });
    if (existing) {
      res.status(400).json({ success: false, message: 'Sudah ada bypass request yang menunggu persetujuan' });
      return;
    }

    const bypass = await prisma.bypassRequest.create({
      data: { stationId, reason: reason.trim() },
    });

    res.status(201).json({ success: true, message: 'Bypass request dikirim', data: bypass });
  } catch (error) {
    console.error('requestBypass error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat bypass request' });
  }
};

export const approveBypass = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: adminId } = req.employee!;
    const { bypassId } = req.params as { bypassId: string };
    const { adminNote } = req.body as { adminNote?: string };

    const bypass = await prisma.bypassRequest.findUnique({
      where: { id: bypassId },
      include: { station: { include: { order: { include: { payment: true } } } } },
    });

    if (!bypass || bypass.status !== BypassStatus.PENDING) {
      res.status(404).json({ success: false, message: 'Bypass request tidak ditemukan' });
      return;
    }

    const isPaid = bypass.station.order.payment?.status === 'PAID';
    const next = nextStation[bypass.station.station];

    await prisma.$transaction(async (tx) => {
      await tx.bypassRequest.update({
        where: { id: bypassId },
        data: { status: BypassStatus.APPROVED, adminId, adminNote: adminNote ?? null, approvedAt: new Date() },
      });

      await tx.orderStation.update({
        where: { id: bypass.stationId },
        data: { status: StationStatus.BYPASSED, completedAt: new Date() },
      });

      if (bypass.station.station === StationName.PACKING) {
        const newOrderStatus = isPaid ? OrderStatus.READY_TO_DELIVER : OrderStatus.WAITING_PAYMENT;
        await tx.order.update({ where: { id: bypass.station.orderId }, data: { status: newOrderStatus } });
      } else if (next) {
        await tx.order.update({
          where: { id: bypass.station.orderId },
          data: { status: stationOrderStatus[next] },
        });
        await tx.orderStation.update({
          where: { orderId_station: { orderId: bypass.station.orderId, station: next } },
          data: { status: StationStatus.PENDING },
        });
      }
    });

    res.json({ success: true, message: 'Bypass disetujui' });
  } catch (error) {
    console.error('approveBypass error:', error);
    res.status(500).json({ success: false, message: 'Gagal menyetujui bypass' });
  }
};

export const rejectBypass = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: adminId } = req.employee!;
    const { bypassId } = req.params as { bypassId: string };
    const { adminNote } = req.body as { adminNote: string };

    if (!adminNote || adminNote.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Keterangan penolakan wajib diisi' });
      return;
    }

    const bypass = await prisma.bypassRequest.findUnique({ where: { id: bypassId } });
    if (!bypass || bypass.status !== BypassStatus.PENDING) {
      res.status(404).json({ success: false, message: 'Bypass request tidak ditemukan' });
      return;
    }

    await prisma.bypassRequest.update({
      where: { id: bypassId },
      data: { status: BypassStatus.REJECTED, adminId, adminNote: adminNote.trim() },
    });

    res.json({ success: true, message: 'Bypass ditolak' });
  } catch (error) {
    console.error('rejectBypass error:', error);
    res.status(500).json({ success: false, message: 'Gagal menolak bypass' });
  }
};

export const getWorkerHistory = async (req: EmployeeRequest, res: Response): Promise<void> => {
  try {
    const { id: workerId } = req.employee!;
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);

    const where = {
      workerId,
      status: { in: [StationStatus.COMPLETED, StationStatus.BYPASSED] as StationStatus[] },
    };

    const [stations, total] = await prisma.$transaction([
      prisma.orderStation.findMany({
        where,
        include: {
          order: {
            select: {
              invoiceNumber: true,
              pickupRequest: { select: { customer: { select: { name: true } } } },
            },
          },
          stationItems: { include: { laundryItem: { select: { name: true } } } },
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.orderStation.count({ where }),
    ]);

    res.json({ success: true, data: stations, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('getWorkerHistory error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil history' });
  }
};
