import rateLimit from "express-rate-limit";
import { Router } from "express";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { getAuthContext } from "./auth.service.js";
import {
  clearSessionCookie,
  createPasswordHash,
  createSessionForUser,
  publicUserSelect,
  rotateSession,
  setSessionCookie,
  verifyPassword,
} from "./auth.service.js";
import { requireAuth } from "./auth.middleware.js";

export const authRouter = Router();

const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

authRouter.get("/", (_req, res) => {
  res.status(200).json({
    module: "auth",
    availableRoutes: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "POST /api/auth/refresh",
      "POST /api/auth/logout",
      "POST /api/auth/logout-all",
    ],
  });
});

authRouter.post("/register", authRateLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: input.username }, { email: input.email }],
    },
    select: {
      username: true,
      email: true,
    },
  });

  if (existingUser?.username === input.username) {
    throw new ApiError(409, "Username already in use");
  }

  if (existingUser?.email === input.email) {
    throw new ApiError(409, "Email already in use");
  }

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: await createPasswordHash(input.password),
      role: "standard",
    },
    select: publicUserSelect,
  });

  const { token, session } = await createSessionForUser(user.id, req);
  setSessionCookie(res, token, session.expiresAt);

  res.status(201).json({
    message: "Registration successful",
    user,
    session,
  });
});

authRouter.post("/login", authRateLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({
    where: {
      username: input.username,
    },
    select: {
      ...publicUserSelect,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid username or password");
  }

  const isPasswordValid = await verifyPassword(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid username or password");
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;
  const { token, session } = await createSessionForUser(publicUser.id, req);
  setSessionCookie(res, token, session.expiresAt);

  res.status(200).json({
    message: "Login successful",
    user: publicUser,
    session,
  });
});

authRouter.post("/refresh", requireAuth, async (req, res) => {
  const auth = getAuthContext(req);
  const { token, session } = await rotateSession(auth.session.id, req);
  setSessionCookie(res, token, session.expiresAt);

  res.status(200).json({
    message: "Session refreshed",
    user: auth.user,
    session,
  });
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  const auth = getAuthContext(req);
  await prisma.session.delete({
    where: {
      id: auth.session.id,
    },
  });

  clearSessionCookie(res);

  res.status(200).json({
    message: "Logged out from current session",
  });
});

authRouter.post("/logout-all", requireAuth, async (req, res) => {
  const auth = getAuthContext(req);
  await prisma.session.deleteMany({
    where: {
      userId: auth.user.id,
    },
  });

  clearSessionCookie(res);

  res.status(200).json({
    message: "Logged out from all sessions",
  });
});
