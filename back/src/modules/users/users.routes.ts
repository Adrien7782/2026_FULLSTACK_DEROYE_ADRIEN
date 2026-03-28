import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { updateProfileSchema } from "../auth/auth.schemas.js";
import { getAuthContext, publicUserSelect } from "../auth/auth.service.js";
import { getFollowStatus } from "../social/social.service.js";

export const usersRouter = Router();

// ── Public endpoints ──────────────────────────────────────────────────────────

/**
 * @openapi
 * /users/search:
 *   get:
 *     summary: Rechercher des utilisateurs par username
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 */
usersRouter.get("/search", async (req, res, next) => {
  try {
    const q = z.string().min(1).max(50).parse(req.query.q);
    const users = await prisma.user.findMany({
      where: { username: { contains: q, mode: "insensitive" } },
      select: { id: true, username: true, avatarUrl: true, isPublic: true },
      take: 10,
    });
    res.json({ users });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /users/by/{username}:
 *   get:
 *     summary: Profil public d'un utilisateur
 *     tags: [Users]
 */
usersRouter.get("/by/:username", async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        isPublic: true,
        isLikesPrivate: true,
        _count: {
          select: {
            followers: { where: { status: "accepted" } },
            following: { where: { status: "accepted" } },
          },
        },
        recommendations: {
          select: {
            comment: true,
            media: { select: { id: true, title: true, slug: true, type: true } },
          },
        },
      },
    });

    if (!user) throw new ApiError(404, "Utilisateur introuvable.");

    const followerCount = user._count.followers;
    const followingCount = user._count.following;

    // Follow status (only if authenticated requester)
    const callerId = req.auth?.user.id ?? null;
    let followStatus: "none" | "pending" | "accepted" = "none";
    if (callerId && callerId !== user.id) {
      followStatus = await getFollowStatus(callerId, user.id);
    }

    // Favorites (visible if profile is public and isLikesPrivate=false)
    let favorites: { id: string; title: string; slug: string; type: string; posterPath: string | null }[] | null = null;
    if (user.isPublic && !user.isLikesPrivate) {
      const favItems = await prisma.favorite.findMany({
        where: { userId: user.id },
        include: { media: { select: { id: true, title: true, slug: true, type: true, posterPath: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      favorites = favItems.map((f) => f.media);
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        isPublic: user.isPublic,
        followerCount,
        followingCount,
        followStatus,
        currentRecommendation: user.recommendations[0] ?? null,
        favorites,
      },
    });
  } catch (e) {
    next(e);
  }
});

// ── Authenticated endpoints ───────────────────────────────────────────────────

usersRouter.use(requireAuth);

usersRouter.get("/", (_req, res) => {
  res.status(200).json({
    module: "users",
    availableRoutes: ["GET /api/users/me", "PATCH /api/users/me", "GET /api/users/by/:username", "GET /api/users/search"],
  });
});

usersRouter.get("/me", (req, res) => {
  const auth = getAuthContext(req);
  res.status(200).json({ user: auth.user, session: auth.session });
});

usersRouter.patch("/me", async (req, res, next) => {
  try {
    const auth = getAuthContext(req);
    const input = updateProfileSchema.parse(req.body);
    const uniqueConstraints: Array<{ username: string } | { email: string }> = [];

    if (input.username) uniqueConstraints.push({ username: input.username });
    if (input.email) uniqueConstraints.push({ email: input.email });

    if (uniqueConstraints.length > 0) {
      const conflict = await prisma.user.findFirst({
        where: { id: { not: auth.user.id }, OR: uniqueConstraints },
        select: { username: true, email: true },
      });
      if (conflict?.username === input.username) throw new ApiError(409, "Username already in use");
      if (conflict?.email === input.email) throw new ApiError(409, "Email already in use");
    }

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        username: input.username,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        avatarUrl: input.avatarUrl,
        isLikesPrivate: input.isLikesPrivate,
        isPublic: input.isPublic,
        notifyOnNewMedia: input.notifyOnNewMedia,
      },
      select: publicUserSelect,
    });

    req.auth = { ...auth, user };
    res.status(200).json({ message: "Profile updated", user, session: auth.session });
  } catch (e) {
    next(e);
  }
});
