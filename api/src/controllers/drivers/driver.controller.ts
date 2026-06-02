import { Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import type { AuthRequest } from "../../middlewares/auth.js";
import { getPaginationParams, buildPaginationMeta, getPrismaSkip } from "../../utils/pagination.js";
import { PickupStatus, DriverTaskStatus, OrderStatus } from "@prisma/client";

// ─── PICKUP ────────────────────────────────────────────────────────

export const getAvailablePickups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = req.user!;
    const params = getPaginationParams(req.query as Record<string, unknown>);

    const where = {
      outletId: driver.outletId!,
      status: PickupStatus.WAITING_DRIVER,
      driverId: null,
    };

    const [pickups, total] = await prisma.$transaction([
      prisma.pickupRequest.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } },
          address: { select: { address: true, latitude: true, longitude: true } },
          outlet: { select: { name: true, latitude: true, longitude: true } },
        },
        skip: getPrismaSkip(params),
        take: params.limit,
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.pickupRequest.count({ where }),
    ]);

    res.json({ data: pickups, meta: buildPaginationMeta(total, params) });
  } catch (err) {
    next(err);
  }
};

export const getMyPickups = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = req.user!;
    const params = getPaginationParams(req.query as Record<string, unknown>);

    const where = {
      driverId: driver.id,
      status: { in: [PickupStatus.ON_THE_WAY, PickupStatus.ARRIVED_AT_OUTLET] },
    };

    const [pickups, total] = await prisma.$transaction([
      prisma.pickupRequest.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } },
          address: { select: { address: true, latitude: true, longitude: true } },
        },
        skip: getPrismaSkip(params),
        take: params.limit,
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.pickupRequest.count({ where }),
    ]);

    res.json({ data: pickups, meta: buildPaginationMeta(total, params) });
  } catch (err) {
    next(err);
  }
};

export const acceptPickup = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const driver = req.user!;

    const pickup = await prisma.pickupRequest.findUnique({ where: { id } });

    if (!pickup) {
      res.status(404).json({ message: "Pickup request tidak ditemukan" });
      return;
    }
    if (pickup.outletId !== driver.outletId) {
      res.status(403).json({ message: "Pickup bukan dari outlet kamu" });
      return;
    }
    if (pickup.status !== PickupStatus.WAITING_DRIVER) {
      res.status(400).json({ message: "Pickup sudah diambil driver lain" });
      return;
    }

    const updated = await prisma.pickupRequest.update({
      where: { id },
      data: { driverId: driver.id, status: PickupStatus.ON_THE_WAY },
    });

    res.json({ message: "Pickup diterima", data: updated });
  } catch (err) {
    next(err);
  }
};

export const arrivedAtOutlet = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const driver = req.user!;

    const pickup = await prisma.pickupRequest.findUnique({ where: { id } });

    if (!pickup) {
      res.status(404).json({ message: "Pickup request tidak ditemukan" });
      return;
    }
    if (pickup.driverId !== driver.id) {
      res.status(403).json({ message: "Ini bukan pickup kamu" });
      return;
    }
    if (pickup.status !== PickupStatus.ON_THE_WAY) {
      res.status(400).json({ message: "Status pickup tidak valid" });
      return;
    }

    const updated = await prisma.pickupRequest.update({
      where: { id },
      data: { status: PickupStatus.ARRIVED_AT_OUTLET },
    });

    res.json({ message: "Tiba di outlet", data: updated });
  } catch (err) {
    next(err);
  }
};

// ─── DELIVERY ──────────────────────────────────────────────────────

export const getMyDeliveries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = req.user!;
    const params = getPaginationParams(req.query as Record<string, unknown>);

    const where = {
      driverId: driver.id,
      status: { in: [DriverTaskStatus.PENDING, DriverTaskStatus.IN_PROGRESS] },
    };

    const [tasks, total] = await prisma.$transaction([
      prisma.driverTask.findMany({
        where,
        include: {
          order: {
            include: {
              pickupRequest: {
                select: {
                  customer: { select: { name: true, phone: true } },
                  address: { select: { address: true, latitude: true, longitude: true } },
                },
              },
            },
          },
        },
        skip: getPrismaSkip(params),
        take: params.limit,
        orderBy: { createdAt: "asc" },
      }),
      prisma.driverTask.count({ where }),
    ]);

    res.json({ data: tasks, meta: buildPaginationMeta(total, params) });
  } catch (err) {
    next(err);
  }
};

export const startDelivery = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const driver = req.user!;

    const task = await prisma.driverTask.findUnique({ where: { id } });

    if (!task) {
      res.status(404).json({ message: "Delivery task tidak ditemukan" });
      return;
    }
    if (task.driverId !== driver.id) {
      res.status(403).json({ message: "Ini bukan delivery kamu" });
      return;
    }
    if (task.status !== DriverTaskStatus.PENDING) {
      res.status(400).json({ message: "Delivery sudah dimulai atau selesai" });
      return;
    }

    const [updated] = await prisma.$transaction([
      prisma.driverTask.update({
        where: { id },
        data: { status: DriverTaskStatus.IN_PROGRESS },
      }),
      prisma.order.update({
        where: { id: task.orderId },
        data: { status: OrderStatus.ON_DELIVERY },
      }),
    ]);

    res.json({ message: "Delivery dimulai", data: updated });
  } catch (err) {
    next(err);
  }
};

export const completeDelivery = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const driver = req.user!;

    const task = await prisma.driverTask.findUnique({ where: { id } });

    if (!task) {
      res.status(404).json({ message: "Delivery task tidak ditemukan" });
      return;
    }
    if (task.driverId !== driver.id) {
      res.status(403).json({ message: "Ini bukan delivery kamu" });
      return;
    }
    if (task.status !== DriverTaskStatus.IN_PROGRESS) {
      res.status(400).json({ message: "Delivery belum dimulai" });
      return;
    }

    await prisma.$transaction([
      prisma.driverTask.update({
        where: { id },
        data: { status: DriverTaskStatus.COMPLETED },
      }),
      prisma.order.update({
        where: { id: task.orderId },
        data: { status: OrderStatus.DELIVERED },
      }),
    ]);

    res.json({ message: "Delivery selesai, menunggu konfirmasi customer" });
  } catch (err) {
    next(err);
  }
};

// ─── HISTORY ───────────────────────────────────────────────────────

export const getHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const driver = req.user!;
    const params = getPaginationParams(req.query as Record<string, unknown>);

    const [pickups, deliveries] = await prisma.$transaction([
      prisma.pickupRequest.findMany({
        where: { driverId: driver.id, status: PickupStatus.ARRIVED_AT_OUTLET },
        include: {
          customer: { select: { name: true } },
          address: { select: { address: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: getPrismaSkip(params),
        take: params.limit,
      }),
      prisma.driverTask.findMany({
        where: { driverId: driver.id, status: DriverTaskStatus.COMPLETED },
        include: {
          order: {
            select: {
              invoiceNumber: true,
              totalPrice: true,
              pickupRequest: {
                select: { customer: { select: { name: true } } },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: getPrismaSkip(params),
        take: params.limit,
      }),
    ]);

    res.json({ data: { pickups, deliveries } });
  } catch (err) {
    next(err);
  }
};
