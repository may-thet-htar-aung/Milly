import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Role } from "../../generated/prisma/client.js";
import { config } from "../config.js";

type AccessPayload = {
  sub: string;
  role: Role;
  type: "access";
};

type RefreshPayload = {
  sub: string;
  sid: string;
  type: "refresh";
};

export const signAccessToken = (userId: string, role: Role) =>
  jwt.sign({ sub: userId, role, type: "access" } satisfies AccessPayload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });

export const signRefreshToken = (userId: string, sessionId: string) =>
  jwt.sign({ sub: userId, sid: sessionId, type: "refresh" } satisfies RefreshPayload, config.JWT_REFRESH_SECRET, {
    expiresIn: `${config.REFRESH_TOKEN_TTL_DAYS}d` as jwt.SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.JWT_REFRESH_SECRET) as RefreshPayload;

export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export const newTokenId = () => crypto.randomUUID();
