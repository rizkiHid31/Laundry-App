import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { prisma } from "../lib/prisma.js";
import type { Role } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    outletId: string | null;
    isVerified: boolean;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // Support both { id } and { userId } in JWT payload
    const payload = jwt.verify(token, config.jwt.secret as string) as {
      id?: string;
      userId?: string;
    };

    const userId = payload.userId ?? payload.id;
    if (!userId) {
      res.status(401).json({ message: "Token tidak valid" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, outletId: true, isVerified: true },
    });

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ message: "Email belum diverifikasi" });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Token tidak valid atau sudah expired" });
  }
};
