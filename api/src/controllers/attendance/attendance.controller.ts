import { Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import type { AuthRequest } from "../../middlewares/auth.js";
import { getPaginationParams, buildPaginationMeta, getPrismaSkip } from "../../utils/pagination.js";

const clockInSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const clockIn = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const parsed = clockInSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validasi gagal", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });

    if (existing) {
      res.status(400).json({ message: "Sudah clock-in hari ini" });
      return;
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        date: today,
        clockIn: new Date(),
      },
    });

    res.status(201).json({ message: "Clock-in berhasil", data: attendance });
  } catch (err) {
    next(err);
  }
};

export const clockOut = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });

    if (!attendance) {
      res.status(400).json({ message: "Belum clock-in hari ini" });
      return;
    }
    if (attendance.clockOut) {
      res.status(400).json({ message: "Sudah clock-out hari ini" });
      return;
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { clockOut: new Date() },
    });

    res.json({ message: "Clock-out berhasil", data: updated });
  } catch (err) {
    next(err);
  }
};

export const getMyAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const params = getPaginationParams(req.query as Record<string, unknown>);

    const { month, year } = req.query as Record<string, string>;
    const dateFilter =
      month && year
        ? {
            gte: new Date(`${year}-${month.padStart(2, "0")}-01`),
            lt: new Date(
              Number(month) === 12
                ? `${Number(year) + 1}-01-01`
                : `${year}-${String(Number(month) + 1).padStart(2, "0")}-01`
            ),
          }
        : undefined;

    const where = {
      userId: user.id,
      ...(dateFilter ? { date: dateFilter } : {}),
    };

    const [records, total] = await prisma.$transaction([
      prisma.attendance.findMany({
        where,
        skip: getPrismaSkip(params),
        take: params.limit,
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({ where }),
    ]);

    res.json({ data: records, meta: buildPaginationMeta(total, params) });
  } catch (err) {
    next(err);
  }
};

export const getAllAttendance = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const params = getPaginationParams(req.query as Record<string, unknown>);
    const { userId, outletId, month, year } = req.query as Record<string, string>;

    const dateFilter =
      month && year
        ? {
            gte: new Date(`${year}-${month.padStart(2, "0")}-01`),
            lt: new Date(
              Number(month) === 12
                ? `${Number(year) + 1}-01-01`
                : `${year}-${String(Number(month) + 1).padStart(2, "0")}-01`
            ),
          }
        : undefined;

    const where = {
      ...(userId ? { userId } : {}),
      ...(outletId ? { user: { outletId } } : {}),
      ...(dateFilter ? { date: dateFilter } : {}),
    };

    const [records, total] = await prisma.$transaction([
      prisma.attendance.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, role: true, workerStation: true } },
        },
        skip: getPrismaSkip(params),
        take: params.limit,
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({ where }),
    ]);

    res.json({ data: records, meta: buildPaginationMeta(total, params) });
  } catch (err) {
    next(err);
  }
};
