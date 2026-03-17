import { createHash, randomBytes } from "node:crypto";
import type { Request, Response } from "express";
import { compare, hash } from "bcryptjs";
import { Prisma } from "../../generated/prisma/client.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import type { AuthContext, PublicSession, PublicUser } from "./auth.types.js";

export const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  isLikesPrivate: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const sessionWithUserSelect = {
  id: true,
  userId: true,
  userAgent: true,
  ipAddress: true,
  expiresAt: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: publicUserSelect,
  },
} satisfies Prisma.SessionSelect;

type SessionWithUser = Prisma.SessionGetPayload<{
  select: typeof sessionWithUserSelect;
}>;

type SessionRecord = Prisma.SessionGetPayload<{
  select: {
    id: true;
    userId: true;
    userAgent: true;
    ipAddress: true;
    expiresAt: true;
    lastUsedAt: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const buildExpiryDate = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.SESSION_TTL_DAYS);
  return expiresAt;
};

const extractClientIp = (req: Request) => {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  if (Array.isArray(forwarded)) {
    return forwarded[0]?.trim() ?? null;
  }

  return req.ip || req.socket.remoteAddress || null;
};

const serializeUser = (user: SessionWithUser["user"]): PublicUser => ({
  id: user.id,
  username: user.username,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  avatarUrl: user.avatarUrl,
  isLikesPrivate: user.isLikesPrivate,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const serializeSession = (session: SessionRecord): PublicSession => ({
  id: session.id,
  userId: session.userId,
  userAgent: session.userAgent,
  ipAddress: session.ipAddress,
  expiresAt: session.expiresAt,
  lastUsedAt: session.lastUsedAt,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
});

export const createPasswordHash = async (password: string) => hash(password, env.BCRYPT_ROUNDS);

export const verifyPassword = async (password: string, passwordHash: string) =>
  compare(password, passwordHash);

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.SESSION_COOKIE_SECURE,
    path: "/",
  });
};

export const setSessionCookie = (res: Response, token: string, expiresAt: Date) => {
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.SESSION_COOKIE_SECURE,
    expires: expiresAt,
    path: "/",
  });
};

export const getAuthContext = (req: Request) => {
  if (!req.auth) {
    throw new ApiError(401, "Authentication required");
  }

  return req.auth;
};

export const createSessionForUser = async (userId: string, req: Request) => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = buildExpiryDate();
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      userAgent: req.get("user-agent") ?? null,
      ipAddress: extractClientIp(req),
      expiresAt,
    },
    select: {
      id: true,
      userId: true,
      userAgent: true,
      ipAddress: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    token,
    session: serializeSession(session),
  };
};

export const rotateSession = async (sessionId: string, req: Request) => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = buildExpiryDate();
  const session = await prisma.session.update({
    where: {
      id: sessionId,
    },
    data: {
      tokenHash: hashToken(token),
      userAgent: req.get("user-agent") ?? null,
      ipAddress: extractClientIp(req),
      expiresAt,
      lastUsedAt: new Date(),
    },
    select: {
      id: true,
      userId: true,
      userAgent: true,
      ipAddress: true,
      expiresAt: true,
      lastUsedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    token,
    session: serializeSession(session),
  };
};

export const resolveAuthContext = async (req: Request): Promise<AuthContext | null> => {
  const token = req.cookies?.[env.SESSION_COOKIE_NAME];

  if (typeof token !== "string" || token.length === 0) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    select: sessionWithUserSelect,
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session
      .delete({
        where: {
          id: session.id,
        },
      })
      .catch(() => undefined);

    return null;
  }

  return {
    user: serializeUser(session.user),
    session: serializeSession(session),
  };
};
