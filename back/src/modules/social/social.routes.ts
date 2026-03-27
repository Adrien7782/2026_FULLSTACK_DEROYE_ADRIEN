import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  listFollowers,
  listFollowing,
  acceptFollowRequest,
  refuseFollowRequest,
  upsertRecommendation,
  deleteRecommendation,
  getMyRecommendation,
  listAllRecommendations,
} from "./social.service.js";

export const socialRouter = Router();

// ── Public ───────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /social/recommendations:
 *   get:
 *     summary: Liste des recommandations communautaires
 *     tags: [Social]
 *     responses:
 *       200:
 *         description: Liste de recommandations
 */
socialRouter.get("/recommendations", async (_req, res, next) => {
  try {
    const items = await listAllRecommendations();
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

// ── Authenticated ─────────────────────────────────────────────────────────────

socialRouter.use(requireAuth);

/**
 * @openapi
 * /social/follow/{userId}:
 *   post:
 *     summary: Suivre un utilisateur
 *     tags: [Social]
 */
socialRouter.post("/follow/:userId", async (req, res, next) => {
  try {
    const followerId = req.auth!.user.id;
    const { userId: followedId } = req.params;
    const follow = await followUser(followerId, followedId);
    res.status(201).json({ follow });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /social/follow/{userId}:
 *   delete:
 *     summary: Se désabonner d'un utilisateur
 *     tags: [Social]
 */
socialRouter.delete("/follow/:userId", async (req, res, next) => {
  try {
    const followerId = req.auth!.user.id;
    const { userId: followedId } = req.params;
    await unfollowUser(followerId, followedId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /social/follow-status/{userId}:
 *   get:
 *     summary: Statut de suivi entre l'utilisateur courant et un autre
 *     tags: [Social]
 */
socialRouter.get("/follow-status/:userId", async (req, res, next) => {
  try {
    const followerId = req.auth!.user.id;
    const { userId: followedId } = req.params;
    const status = await getFollowStatus(followerId, followedId);
    res.json({ status });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /social/followers:
 *   get:
 *     summary: Liste de mes abonnés
 *     tags: [Social]
 */
socialRouter.get("/followers", async (req, res, next) => {
  try {
    const userId = req.auth!.user.id;
    const items = await listFollowers(userId);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /social/following:
 *   get:
 *     summary: Liste des utilisateurs que je suis
 *     tags: [Social]
 */
socialRouter.get("/following", async (req, res, next) => {
  try {
    const userId = req.auth!.user.id;
    const items = await listFollowing(userId);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /social/follow-requests/{id}/accept:
 *   patch:
 *     summary: Accepter une demande de suivi
 *     tags: [Social]
 */
socialRouter.patch("/follow-requests/:id/accept", async (req, res, next) => {
  try {
    const userId = req.auth!.user.id;
    const follow = await acceptFollowRequest(req.params.id, userId);
    res.json({ follow });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /social/follow-requests/{id}/refuse:
 *   patch:
 *     summary: Refuser une demande de suivi
 *     tags: [Social]
 */
socialRouter.patch("/follow-requests/:id/refuse", async (req, res, next) => {
  try {
    const userId = req.auth!.user.id;
    await refuseFollowRequest(req.params.id, userId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// ── My recommendation ─────────────────────────────────────────────────────────

const recommendationSchema = z.object({
  comment: z.string().min(1).max(500),
});

/**
 * @openapi
 * /me/recommendation:
 *   get:
 *     summary: Ma recommandation courante
 *     tags: [Social]
 */
socialRouter.get("/me/recommendation", async (req, res, next) => {
  try {
    const rec = await getMyRecommendation(req.auth!.user.id);
    res.json({ recommendation: rec });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /me/recommendation/{mediaId}:
 *   post:
 *     summary: Créer ou mettre à jour ma recommandation
 *     tags: [Social]
 */
socialRouter.post("/me/recommendation/:mediaId", async (req, res, next) => {
  try {
    const parsed = recommendationSchema.parse(req.body);
    const rec = await upsertRecommendation(req.auth!.user.id, req.params.mediaId, parsed.comment);
    res.status(201).json({ recommendation: rec });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /me/recommendation:
 *   delete:
 *     summary: Supprimer ma recommandation
 *     tags: [Social]
 */
socialRouter.delete("/me/recommendation", async (req, res, next) => {
  try {
    await deleteRecommendation(req.auth!.user.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});
