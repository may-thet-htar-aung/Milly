import { Router } from "express";
import { Currency, ListingCondition, ListingStatus } from "../../generated/prisma/client.js";
import { z } from "zod";
import { authenticate, authenticateOptional } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { requiredParam } from "../utils/params.js";

export const listingsRouter = Router();

const imageUrlSchema = z.union([
  z.string().url().max(2048),
  z.string().regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/).max(7_000_000),
]);
const imageSchema = z.object({ url: imageUrlSchema, altText: z.string().trim().max(160).optional() });
const listingInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  priceMinor: z.number().int().positive(),
  currency: z.nativeEnum(Currency),
  condition: z.nativeEnum(ListingCondition),
  categoryId: z.string().min(1),
  location: z.string().trim().min(2).max(120),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  images: z.array(imageSchema).max(10).default([]),
});

const updateListingSchema = listingInputSchema.partial();
const querySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  categoryId: z.string().optional(),
  condition: z.nativeEnum(ListingCondition).optional(),
  currency: z.nativeEnum(Currency).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  location: z.string().trim().max(120).optional(),
  sellerId: z.string().optional(),
  status: z.nativeEnum(ListingStatus).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "most_viewed"]).default("newest"),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

const reportSchema = z.object({
  reason: z.enum(["SPAM", "FRAUD", "PROHIBITED_ITEM", "INACCURATE_INFORMATION", "HARASSMENT", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});

const listingInclude = {
  seller: { select: { id: true, name: true, avatarUrl: true, location: true } },
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
};

const canManage = (requestUser: Express.User | undefined, sellerId: string) => requestUser?.role === "ADMIN" || requestUser?.id === sellerId;

const getListingOrThrow = async (id: string) => {
  const listing = await prisma.listing.findUnique({ where: { id }, include: listingInclude });
  if (!listing) throw new AppError(404, "LISTING_NOT_FOUND", "Listing not found.");
  return listing;
};

listingsRouter.get(
  "/",
  authenticateOptional,
  asyncHandler(async (request, response) => {
    const query = querySchema.parse(request.query);
    const status = query.status ?? ListingStatus.ACTIVE;
    if (status !== ListingStatus.ACTIVE && request.user?.role !== "ADMIN") {
      throw new AppError(403, "FORBIDDEN", "Only admins can browse non-active listings globally.");
    }

    const where = {
      status,
      hiddenAt: null,
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.condition ? { condition: query.condition } : {}),
      ...(query.currency ? { currency: query.currency } : {}),
      ...(query.sellerId ? { sellerId: query.sellerId } : {}),
      ...(query.location ? { location: { contains: query.location } } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined ? { priceMinor: { ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}), ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}) } } : {}),
      ...(query.q ? { OR: [{ title: { contains: query.q } }, { description: { contains: query.q } }] } : {}),
    };

    const orderBy = query.sort === "price_asc" ? { priceMinor: "asc" as const } : query.sort === "price_desc" ? { priceMinor: "desc" as const } : query.sort === "most_viewed" ? { viewCount: "desc" as const } : { createdAt: "desc" as const };
    const skip = (query.page - 1) * query.pageSize;
    const [total, listings] = await prisma.$transaction([
      prisma.listing.count({ where }),
      prisma.listing.findMany({ where, orderBy, skip, take: query.pageSize, include: listingInclude }),
    ]);

    const favoriteIds = request.user
      ? new Set((await prisma.favorite.findMany({ where: { userId: request.user.id, listingId: { in: listings.map((listing) => listing.id) } }, select: { listingId: true } })).map((favorite) => favorite.listingId))
      : new Set<string>();
    response.json({ data: listings.map((listing) => ({ ...listing, isFavorite: favoriteIds.has(listing.id) })), meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } });
  }),
);

listingsRouter.post(
  "/",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = listingInputSchema.parse(request.body);
    const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
    if (!category) throw new AppError(400, "CATEGORY_NOT_FOUND", "The selected category does not exist.");

    const listing = await prisma.listing.create({
      data: {
        sellerId: request.user!.id,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        priceMinor: input.priceMinor,
        currency: input.currency,
        condition: input.condition,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        images: { create: input.images.map((image, index) => ({ url: image.url, altText: image.altText, sortOrder: index })) },
      },
      include: listingInclude,
    });
    response.status(201).json({ data: listing });
  }),
);

listingsRouter.get(
  "/:id",
  authenticateOptional,
  asyncHandler(async (request, response) => {
    const listing = await getListingOrThrow(requiredParam(request.params.id, "id"));
    if ((listing.hiddenAt || listing.status !== ListingStatus.ACTIVE) && !canManage(request.user, listing.sellerId)) {
      throw new AppError(404, "LISTING_NOT_FOUND", "Listing not found.");
    }
    await prisma.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } });
    const favorite = request.user ? await prisma.favorite.findUnique({ where: { userId_listingId: { userId: request.user.id, listingId: listing.id } } }) : null;
    response.json({ data: { ...listing, viewCount: listing.viewCount + 1, isFavorite: Boolean(favorite) } });
  }),
);

listingsRouter.patch(
  "/:id",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = updateListingSchema.parse(request.body);
    const current = await getListingOrThrow(requiredParam(request.params.id, "id"));
    if (!canManage(request.user, current.sellerId)) throw new AppError(403, "FORBIDDEN", "You can only edit your own listings.");
    if (input.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
      if (!category) throw new AppError(400, "CATEGORY_NOT_FOUND", "The selected category does not exist.");
    }

    const { images, ...fields } = input;
    const listing = await prisma.$transaction(async (transaction) => {
      if (images) await transaction.listingImage.deleteMany({ where: { listingId: current.id } });
      return transaction.listing.update({
        where: { id: current.id },
        data: { ...fields, ...(images ? { images: { create: images.map((image, index) => ({ url: image.url, altText: image.altText, sortOrder: index })) } } : {}) },
        include: listingInclude,
      });
    });
    response.json({ data: listing });
  }),
);

listingsRouter.delete(
  "/:id",
  authenticate,
  asyncHandler(async (request, response) => {
    const listing = await getListingOrThrow(requiredParam(request.params.id, "id"));
    if (!canManage(request.user, listing.sellerId)) throw new AppError(403, "FORBIDDEN", "You can only archive your own listings.");
    await prisma.listing.update({ where: { id: listing.id }, data: { status: ListingStatus.ARCHIVED } });
    response.status(204).send();
  }),
);

const statusAction = (status: ListingStatus, published = false) => [authenticate, asyncHandler(async (request, response) => {
  const listing = await getListingOrThrow(requiredParam(request.params.id, "id"));
  if (!canManage(request.user, listing.sellerId)) throw new AppError(403, "FORBIDDEN", "You can only manage your own listings.");
  const updated = await prisma.listing.update({ where: { id: listing.id }, data: { status, ...(published ? { publishedAt: new Date() } : {}) }, include: listingInclude });
  response.json({ data: updated });
})] as const;

listingsRouter.post("/:id/publish", ...statusAction(ListingStatus.ACTIVE, true));
listingsRouter.post("/:id/reserve", ...statusAction(ListingStatus.RESERVED));
listingsRouter.post("/:id/mark-sold", ...statusAction(ListingStatus.SOLD));

listingsRouter.post(
  "/:id/favorite",
  authenticate,
  asyncHandler(async (request, response) => {
    const listing = await getListingOrThrow(requiredParam(request.params.id, "id"));
    if (listing.status !== ListingStatus.ACTIVE) throw new AppError(400, "LISTING_NOT_ACTIVE", "Only active listings can be favorited.");
    await prisma.favorite.upsert({ where: { userId_listingId: { userId: request.user!.id, listingId: listing.id } }, create: { userId: request.user!.id, listingId: listing.id }, update: {} });
    response.status(204).send();
  }),
);

listingsRouter.delete(
  "/:id/favorite",
  authenticate,
  asyncHandler(async (request, response) => {
    await prisma.favorite.deleteMany({ where: { userId: request.user!.id, listingId: requiredParam(request.params.id, "id") } });
    response.status(204).send();
  }),
);

listingsRouter.post(
  "/:id/report",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = reportSchema.parse(request.body);
    const listing = await getListingOrThrow(requiredParam(request.params.id, "id"));
    const report = await prisma.report.create({ data: { reporterId: request.user!.id, listingId: listing.id, reason: input.reason, details: input.details } });
    response.status(201).json({ data: { id: report.id, status: report.status, createdAt: report.createdAt } });
  }),
);
