import type { RequestHandler } from "express";
import { Role } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

const getBearerToken = (authorization?: string) => {
  if (!authorization?.startsWith("Bearer ")) return undefined;
  return authorization.slice("Bearer ".length).trim();
};

export const authenticate: RequestHandler = async (request, _response, next) => {
  try {
    const token = getBearerToken(request.header("authorization"));
    if (!token) throw new AppError(401, "UNAUTHENTICATED", "A bearer access token is required.");

    const payload = verifyAccessToken(token);
    if (payload.type !== "access" || !payload.sub) {
      throw new AppError(401, "INVALID_ACCESS_TOKEN", "The access token is invalid.");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true },
    });

    if (!user?.isActive) throw new AppError(401, "ACCOUNT_INACTIVE", "This account is inactive.");
    request.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "INVALID_ACCESS_TOKEN", "The access token is invalid."));
  }
};

export const authenticateOptional: RequestHandler = async (request, _response, next) => {
  const token = getBearerToken(request.header("authorization"));
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== "access" || !payload.sub) return next();
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, role: true, isActive: true } });
    if (user?.isActive) request.user = { id: user.id, role: user.role };
    next();
  } catch {
    next();
  }
};

export const requireRole = (role: Role): RequestHandler => (request, _response, next) => {
  if (!request.user || request.user.role !== role) {
    next(new AppError(403, "FORBIDDEN", "You do not have permission to perform this action."));
    return;
  }
  next();
};
