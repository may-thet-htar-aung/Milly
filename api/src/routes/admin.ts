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
const listingVisibilitySchema = z.object({ hidden: z.boolean() });
const userStatusSchema = z.object({ isActive: z.boolean() });

const userSelect = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, _count: { select: { listings: true } } } as const;
const toAdminUser = (user: { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: Date; _count: { listings: number } }) => ({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt, listingCount: user._count.listings });

adminRouter.get(
  "/users",
  asyncHandler(async (_request, response) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: userSelect });
    response.json({ data: users.map(toAdminUser) });
  }),
);

adminRouter.get(
  "/users/:id",
  asyncHandler(async (request, response) => {
    const userId = requiredParam(request.params.id, "id");
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { ...userSelect, phone: true, location: true } });
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found.");
    const counts = await prisma.listing.groupBy({ by: ["status"], where: { sellerId: userId }, _count: { _all: true } });
    const countFor = (status: ListingStatus) => counts.find((row) => row.status === status)?._count._all ?? 0;
    response.json({ data: { ...toAdminUser(user), phone: user.phone, location: user.location, activeListingCount: countFor(ListingStatus.ACTIVE), archivedListingCount: countFor(ListingStatus.ARCHIVED) } });
  }),
);

adminRouter.get(
  "/listings",
  asyncHandler(async (request, response) => {
    const query = z.object({
      q: z.string().trim().min(1).max(100).optional(),
      sellerId: z.string().trim().min(1).optional(),
      status: z.nativeEnum(ListingStatus).optional(),
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(50).default(24),
    }).parse(request.query);
    const where = {
      ...(query.sellerId ? { sellerId: query.sellerId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? { OR: [{ title: { contains: query.q } }, { description: { contains: query.q } }] } : {}),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [total, listings] = await prisma.$transaction([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.pageSize,
        include: { seller: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      }),
    ]);
    response.json({ data: listings, meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } });
  }),
);

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
  "/listings/:id/visibility",
  asyncHandler(async (request, response) => {
    const input = listingVisibilitySchema.parse(request.body);
    const listing = await prisma.listing.update({ where: { id: requiredParam(request.params.id, "id") }, data: { hiddenAt: input.hidden ? new Date() : null } });
    response.json({ data: listing });
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
