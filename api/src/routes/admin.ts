import { Router } from "express";
import { ReportStatus, ListingStatus, Role } from "../../generated/prisma/client.js";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { requiredParam } from "../utils/params.js";

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole(Role.ADMIN));

const reportStatusSchema = z.object({ status: z.nativeEnum(ReportStatus) });
const listingStatusSchema = z.object({ status: z.nativeEnum(ListingStatus) });
const userStatusSchema = z.object({ isActive: z.boolean() });

adminRouter.get(
  "/reports",
  asyncHandler(async (_request, response) => {
    const reports = await prisma.report.findMany({ orderBy: { createdAt: "desc" }, include: { reporter: { select: { id: true, name: true, email: true } }, reportedUser: { select: { id: true, name: true, email: true } }, listing: { select: { id: true, title: true, status: true } } } });
    response.json({ data: reports });
  }),
);

adminRouter.patch(
  "/reports/:id",
  asyncHandler(async (request, response) => {
    const input = reportStatusSchema.parse(request.body);
    const report = await prisma.report.update({ where: { id: requiredParam(request.params.id, "id") }, data: { status: input.status } });
    response.json({ data: report });
  }),
);

adminRouter.patch(
  "/listings/:id/status",
  asyncHandler(async (request, response) => {
    const input = listingStatusSchema.parse(request.body);
    const listing = await prisma.listing.update({ where: { id: requiredParam(request.params.id, "id") }, data: { status: input.status, ...(input.status === ListingStatus.ACTIVE ? { publishedAt: new Date() } : {}) } });
    response.json({ data: listing });
  }),
);

adminRouter.patch(
  "/users/:id/status",
  asyncHandler(async (request, response) => {
    const input = userStatusSchema.parse(request.body);
    const userId = requiredParam(request.params.id, "id");
    if (userId === request.user!.id) throw new AppError(400, "CANNOT_DEACTIVATE_SELF", "An admin cannot deactivate their own account.");
    const user = await prisma.user.update({ where: { id: userId }, data: { isActive: input.isActive }, select: { id: true, isActive: true } });
    response.json({ data: user });
  }),
);
