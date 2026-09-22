import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { requiredParam } from "../utils/params.js";

export const usersRouter = Router();

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
});

const listingInclude = {
  seller: { select: { id: true, name: true, avatarUrl: true, location: true } },
  category: true,
  images: { orderBy: { sortOrder: "asc" as const } },
};

usersRouter.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const userId = requiredParam(request.params.id, "id");
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: { id: true, name: true, avatarUrl: true, bio: true, location: true, createdAt: true, _count: { select: { listings: true } } },
    });
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found.");
    response.json({ data: { ...user, listingCount: user._count.listings } });
  }),
);

usersRouter.patch(
  "/me",
  authenticate,
  asyncHandler(async (request, response) => {
    const input = profileSchema.parse(request.body);
    const user = await prisma.user.update({ where: { id: request.user!.id }, data: input, select: { id: true, name: true, email: true, avatarUrl: true, phone: true, bio: true, location: true, role: true, createdAt: true, updatedAt: true } });
    response.json({ data: user });
  }),
);

usersRouter.get(
  "/me/listings",
  authenticate,
  asyncHandler(async (request, response) => {
    const listings = await prisma.listing.findMany({ where: { sellerId: request.user!.id }, orderBy: { createdAt: "desc" }, include: listingInclude });
    response.json({ data: listings });
  }),
);

usersRouter.get(
  "/me/favorites",
  authenticate,
  asyncHandler(async (request, response) => {
    const favorites = await prisma.favorite.findMany({ where: { userId: request.user!.id }, orderBy: { createdAt: "desc" }, include: { listing: { include: listingInclude } } });
    response.json({ data: favorites.map((favorite) => ({ ...favorite.listing, isFavorite: true, favoritedAt: favorite.createdAt })) });
  }),
);
