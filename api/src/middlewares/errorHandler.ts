import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);

  if (res.headersSent) return;

  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ message });
};
