import { Router, type Response } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { config } from "../config.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AppError } from "../utils/app-error.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { hashToken, newTokenId, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

const refreshSchema = z.object({ refreshToken: z.string().min(1).optional() });
const refreshCookieName = "milly_refresh";

const publicUser = (user: { id: string; name: string; email: string; avatarUrl: string | null; phone: string | null; bio: string | null; location: string | null; role: string; createdAt: Date }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl,
  phone: user.phone,
  bio: user.bio,
  location: user.location,
  role: user.role,
  createdAt: user.createdAt,
});

const createSession = async (userId: string) => {
  const sessionId = newTokenId();
  const refreshToken = signRefreshToken(userId, sessionId);
  const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshSession.create({ data: { id: sessionId, userId, tokenHash: hashToken(refreshToken), expiresAt } });
  return { refreshToken, expiresAt };
};

const setRefreshCookie = (response: Response, refreshToken: string) => {
  response.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.NODE_ENV === "production",
    maxAge: config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });
};

authRouter.post(
  "/register",
  asyncHandler(async (request, response) => {
    const input = credentialsSchema.extend({ name: z.string().trim().min(2).max(80) }).parse(request.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError(409, "EMAIL_IN_USE", "An account with this email already exists.");

    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash: await hashPassword(input.password) },
    });
    const session = await createSession(user.id);
    setRefreshCookie(response, session.refreshToken);
    response.status(201).json({ user: publicUser(user), accessToken: signAccessToken(user.id, user.role), refreshToken: session.refreshToken, refreshTokenExpiresAt: session.expiresAt });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (request, response) => {
    const input = credentialsSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive || !(await comparePassword(input.password, user.passwordHash))) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    const session = await createSession(user.id);
    setRefreshCookie(response, session.refreshToken);
    response.json({ user: publicUser(user), accessToken: signAccessToken(user.id, user.role), refreshToken: session.refreshToken, refreshTokenExpiresAt: session.expiresAt });
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (request, response) => {
    const input = refreshSchema.parse(request.body ?? {});
    const refreshToken = input.refreshToken ?? request.cookies?.[refreshCookieName];
    if (!refreshToken) throw new AppError(401, "INVALID_REFRESH_TOKEN", "A refresh token is required.");

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "The refresh token is invalid or expired.");
    }
    if (payload.type !== "refresh" || !payload.sid || !payload.sub) throw new AppError(401, "INVALID_REFRESH_TOKEN", "The refresh token is invalid.");

    const session = await prisma.refreshSession.findUnique({ where: { id: payload.sid }, include: { user: true } });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.tokenHash !== hashToken(refreshToken) || !session.user.isActive) {
      throw new AppError(401, "INVALID_REFRESH_TOKEN", "The refresh token is invalid or expired.");
    }

    const nextSession = await prisma.$transaction(async (transaction) => {
      await transaction.refreshSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      const nextId = newTokenId();
      const nextRefreshToken = signRefreshToken(session.userId, nextId);
      const expiresAt = new Date(Date.now() + config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
      await transaction.refreshSession.create({ data: { id: nextId, userId: session.userId, tokenHash: hashToken(nextRefreshToken), expiresAt } });
      return { nextRefreshToken, expiresAt };
    });

    setRefreshCookie(response, nextSession.nextRefreshToken);
    response.json({ user: publicUser(session.user), accessToken: signAccessToken(session.user.id, session.user.role), refreshToken: nextSession.nextRefreshToken, refreshTokenExpiresAt: nextSession.expiresAt });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (request, response) => {
    const input = refreshSchema.parse(request.body ?? {});
    const refreshToken = input.refreshToken ?? request.cookies?.[refreshCookieName];
    if (refreshToken) {
      await prisma.refreshSession.updateMany({ where: { tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
    }
    response.clearCookie(refreshCookieName, { path: "/api/v1/auth" });
    response.status(204).send();
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (request, response) => {
    const user = await prisma.user.findUnique({ where: { id: request.user!.id } });
    if (!user) throw new AppError(404, "USER_NOT_FOUND", "User not found.");
    response.json({ user: publicUser(user) });
  }),
);
