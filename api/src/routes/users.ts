import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { requiredParam } from "../utils/params.js";
import { comparePassword, hashPassword } from "../utils/password.js";

export const usersRouter = Router();

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  bio: z.string().trim().max(500).nullable().optional(),
  location: z.string().trim().max(120).nullable().optional(),
  email: z.string().trim().toLowerCase().email().max(160).optional(),
  currentPassword: z.string().min(8).max(128).optional(),
  newPassword: z.string().min(8).max(128).optional(),
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
    const { currentPassword, newPassword, email, ...profile } = profileSchema.parse(request.body);
    const existing = await prisma.user.findUnique({ where: { id: request.user!.id }, select: { email: true, passwordHash: true } });
    if (!existing) throw new AppError(404, "USER_NOT_FOUND", "User not found.");
    const changingEmail = Boolean(email && email !== existing.email);
    const changingPassword = Boolean(newPassword);
    if ((changingEmail || changingPassword || currentPassword) && !currentPassword) throw new AppError(400, "PASSWORD_REQUIRED", "Enter your current password to authorize this change.");
    const data: typeof profile & { email?: string; passwordHash?: string } = { ...profile };
    if (currentPassword && !(await comparePassword(currentPassword, existing.passwordHash))) throw new AppError(400, "INVALID_PASSWORD", "Current password is incorrect.");
    if (changingEmail && email) {
      const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (taken && taken.id !== request.user!.id) throw new AppError(409, "EMAIL_IN_USE", "That email address is already in use.");
      data.email = email;
    }
    if (changingPassword && newPassword) data.passwordHash = await hashPassword(newPassword);
    const user = await prisma.user.update({ where: { id: request.user!.id }, data, select: { id: true, name: true, email: true, avatarUrl: true, phone: true, bio: true, location: true, role: true, createdAt: true, updatedAt: true } });
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
    response.json({ data: favorites.filter((favorite) => !favorite.listing.hiddenAt).map((favorite) => ({ ...favorite.listing, isFavorite: true, favoritedAt: favorite.createdAt })) });
  }),
);
