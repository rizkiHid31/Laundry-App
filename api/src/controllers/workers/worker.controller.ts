import { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import type { AuthRequest } from "../../middlewares/auth.js";
import { getPaginationParams, buildPaginationMeta, getPrismaSkip } from "../../utils/pagination.js";
import { WorkerStation, StationStatus, OrderStatus } from "@prisma/client";

const completeStationSchema = z.object({
  items: z
    .array(z.object({ laundryItemId: z.string(), quantity: z.number().int().min(1) }))
    .min(1),
});

const bypassSchema = z.object({
  reason: z.string().min(10, "Alasan minimal 10 karakter"),
});

const stationToOrderStatus: Record<WorkerStation, OrderStatus> = {
  WASHING: OrderStatus.WASHING,
  IRONING: OrderStatus.IRONING,
  PACKING: OrderStatus.PACKING,
};

export const getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const worker = req.user!;
    if (!worker.workerStation) {
      res.status(400).json({ message: "Worker tidak memiliki station" });
      return;
    }

    const params = getPaginationParams(req.query as Record<string, unknown>);

    const where = {
      station: worker.workerStation,
      status: { in: [StationStatus.PENDING, StationStatus.IN_PROGRESS] },
      order: { outletId: worker.outletId! },
    };

    const [stations, total] = await prisma.$transaction([
      prisma.orderStation.findMany({
        where,
        include: {
          order: {
            include: {
              orderItems: { include: { laundryItem: true } },
              pickupRequest: {
                select: {
                  scheduledAt: true,
                  customer: { select: { name: true } },
                },
              },
            },
          },
        },
        skip: getPrismaSkip(params),
        take: params.limit,
        orderBy: { createdAt: "asc" },
      }),
      prisma.orderStation.count({ where }),
    ]);

    res.json({ data: stations, meta: buildPaginationMeta(total, params) });
  } catch (err) {
    next(err);
  }
};

export const getOrderDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: { include: { laundryItem: true } },
        orderStations: {
          include: { stationItems: { include: { laundryItem: true } } },
        },
        pickupRequest: {
          select: {
            scheduledAt: true,
            customer: { select: { name: true, phone: true } },
            address: { select: { address: true } },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ message: "Order tidak ditemukan" });
      return;
    }

    res.json({ data: order });
  } catch (err) {
    next(err);
  }
};

export const startStation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stationId } = req.params;
    const worker = req.user!;

    const station = await prisma.orderStation.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      res.status(404).json({ message: "Station tidak ditemukan" });
      return;
    }
    if (station.station !== worker.workerStation) {
      res.status(403).json({ message: "Station ini bukan bagian kamu" });
      return;
    }
    if (station.status !== StationStatus.PENDING) {
      res.status(400).json({ message: "Station sudah dimulai atau selesai" });
      return;
    }

    const [updated] = await prisma.$transaction([
      prisma.orderStation.update({
        where: { id: stationId },
        data: {
          status: StationStatus.IN_PROGRESS,
          workerId: worker.id,
          startedAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: station.orderId },
        data: { status: stationToOrderStatus[station.station] },
      }),
    ]);

    res.json({ message: "Station dimulai", data: updated });
  } catch (err) {
    next(err);
  }
};

export const completeStation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stationId } = req.params;
    const worker = req.user!;

    const parsed = completeStationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const station = await prisma.orderStation.findUnique({
      where: { id: stationId },
      include: { order: { include: { orderItems: true } } },
    });

    if (!station) {
      res.status(404).json({ message: "Station tidak ditemukan" });
      return;
    }
    if (station.workerId !== worker.id) {
      res.status(403).json({ message: "Kamu tidak mengerjakan station ini" });
      return;
    }
    if (station.status !== StationStatus.IN_PROGRESS) {
      res.status(400).json({ message: "Station belum dimulai" });
      return;
    }

    const { items } = parsed.data;
    const orderItemMap = new Map(
      station.order.orderItems.map((i) => [i.laundryItemId, i.quantity])
    );
    const hasDiscrepancy = items.some(
      (i) => orderItemMap.get(i.laundryItemId) !== i.quantity
    );

    if (hasDiscrepancy) {
      await prisma.$transaction([
        prisma.stationItem.createMany({
          data: items.map((i) => ({ orderStationId: stationId, ...i })),
          skipDuplicates: true,
        }),
        prisma.orderStation.update({
          where: { id: stationId },
          data: { status: StationStatus.BYPASSED },
        }),
        prisma.bypassRequest.create({
          data: {
            orderStationId: stationId,
            reason: "Jumlah item tidak sesuai dengan order",
          },
        }),
      ]);

      res.json({ message: "Jumlah tidak sesuai, bypass request dibuat ke admin" });
      return;
    }

    const isPackingStation = station.station === WorkerStation.PACKING;

    await prisma.$transaction([
      prisma.stationItem.createMany({
        data: items.map((i) => ({ orderStationId: stationId, ...i })),
        skipDuplicates: true,
      }),
      prisma.orderStation.update({
        where: { id: stationId },
        data: { status: StationStatus.COMPLETED, completedAt: new Date() },
      }),
      ...(isPackingStation
        ? [
            prisma.order.update({
              where: { id: station.orderId },
              data: { status: OrderStatus.WAITING_PAYMENT },
            }),
          ]
        : []),
    ]);

    res.json({ message: "Station selesai" });
  } catch (err) {
    next(err);
  }
};

export const requestBypass = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stationId } = req.params;
    const worker = req.user!;

    const parsed = bypassSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const station = await prisma.orderStation.findUnique({ where: { id: stationId } });

    if (!station) {
      res.status(404).json({ message: "Station tidak ditemukan" });
      return;
    }
    if (station.workerId !== worker.id) {
      res.status(403).json({ message: "Kamu tidak mengerjakan station ini" });
      return;
    }

    const bypass = await prisma.bypassRequest.create({
      data: { orderStationId: stationId, reason: parsed.data.reason },
    });

    res.status(201).json({ message: "Bypass request dikirim", data: bypass });
  } catch (err) {
    next(err);
  }
};
