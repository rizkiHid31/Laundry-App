import { Response, NextFunction } from "express";
import type { Role } from "@prisma/client";
import type { AuthRequest } from "./auth.js";

export const requireRole = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Akses ditolak" });
      return;
    }
    next();
  };
};
