import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { prisma } from "../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ status: "ok", service: "milly-api", timestamp: new Date().toISOString() });
  }),
);
