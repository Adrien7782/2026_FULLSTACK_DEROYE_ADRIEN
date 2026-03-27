import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/errors.js";
import { createNotification } from "../notifications/notifications.service.js";

// ── Follow ──────────────────────────────────────────────────────────────────

export const followUser = async (followerId: string, followedId: string) => {
  if (followerId === followedId) throw new ApiError(400, "Impossible de se suivre soi-même.");

  const existing = await prisma.follow.findUnique({
    where: { followerId_followedId: { followerId, followedId } },
  });
  if (existing) throw new ApiError(409, "Vous suivez déjà cet utilisateur ou une demande est en attente.");

  const followed = await prisma.user.findUnique({ where: { id: followedId }, select: { id: true, username: true, isPublic: true } });
  if (!followed) throw new ApiError(404, "Utilisateur introuvable.");

  const follower = await prisma.user.findUnique({ where: { id: followerId }, select: { username: true } });
  if (!follower) throw new ApiError(404, "Utilisateur introuvable.");

  if (followed.isPublic) {
    const follow = await prisma.follow.create({
      data: { followerId, followedId, status: "accepted" },
    });
    await createNotification(
      followedId,
      "follow_accepted",
      "Nouvel abonné",
      `${follower.username} s'est abonné à votre profil.`,
      `/users/${follower.username}`,
      follow.id,
    );
    return follow;
  } else {
    const follow = await prisma.follow.create({
      data: { followerId, followedId, status: "pending" },
    });
    await createNotification(
      followedId,
      "follow_request",
      "Demande d'abonnement",
      `${follower.username} souhaite s'abonner à votre profil.`,
      `/users/${follower.username}`,
      follow.id,
    );
    return follow;
  }
};

export const unfollowUser = async (followerId: string, followedId: string) => {
  const existing = await prisma.follow.findUnique({
    where: { followerId_followedId: { followerId, followedId } },
  });
  if (!existing) throw new ApiError(404, "Abonnement introuvable.");
  await prisma.follow.delete({ where: { id: existing.id } });
};

export const getFollowStatus = async (followerId: string, followedId: string) => {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followedId: { followerId, followedId } },
  });
  if (!follow) return "none" as const;
  return follow.status as "pending" | "accepted";
};

export const listFollowers = async (userId: string) => {
  const follows = await prisma.follow.findMany({
    where: { followedId: userId, status: "accepted" },
    include: { follower: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => f.follower);
};

export const listFollowing = async (userId: string) => {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId, status: "accepted" },
    include: { followed: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
  return follows.map((f) => f.followed);
};

export const listPendingRequests = async (userId: string) => {
  return prisma.follow.findMany({
    where: { followedId: userId, status: "pending" },
    include: { follower: { select: { id: true, username: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const acceptFollowRequest = async (followId: string, userId: string) => {
  const follow = await prisma.follow.findUnique({ where: { id: followId } });
  if (!follow) throw new ApiError(404, "Demande introuvable.");
  if (follow.followedId !== userId) throw new ApiError(403, "Accès refusé.");
  if (follow.status !== "pending") throw new ApiError(400, "Cette demande n'est pas en attente.");

  const updated = await prisma.follow.update({
    where: { id: followId },
    data: { status: "accepted" },
    include: { followed: { select: { username: true } } },
  });

  await createNotification(
    follow.followerId,
    "follow_accepted",
    "Demande acceptée",
    `${updated.followed.username} a accepté votre demande d'abonnement.`,
    `/users/${updated.followed.username}`,
    follow.id,
  );

  return updated;
};

export const refuseFollowRequest = async (followId: string, userId: string) => {
  const follow = await prisma.follow.findUnique({ where: { id: followId } });
  if (!follow) throw new ApiError(404, "Demande introuvable.");
  if (follow.followedId !== userId) throw new ApiError(403, "Accès refusé.");
  await prisma.follow.delete({ where: { id: followId } });
};

// ── Recommendations ──────────────────────────────────────────────────────────

export const upsertRecommendation = async (userId: string, mediaId: string, comment: string) => {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true, title: true, slug: true, type: true },
  });
  if (!media) throw new ApiError(404, "Média introuvable.");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });
  if (!user) throw new ApiError(404, "Utilisateur introuvable.");

  const recommendation = await prisma.mediaRecommendation.upsert({
    where: { userId },
    create: { userId, mediaId, comment },
    update: { mediaId, comment },
  });

  // Notify accepted followers
  const followers = await prisma.follow.findMany({
    where: { followedId: userId, status: "accepted" },
    select: { followerId: true },
  });

  const mediaPath = `/${media.type === "film" ? "films" : "series"}/${media.slug}`;
  await Promise.allSettled(
    followers.map((f) =>
      createNotification(
        f.followerId,
        "new_recommendation",
        "Nouvelle recommandation",
        `${user.username} recommande "${media.title}".`,
        mediaPath,
      ),
    ),
  );

  return recommendation;
};

export const deleteRecommendation = async (userId: string) => {
  const existing = await prisma.mediaRecommendation.findUnique({ where: { userId } });
  if (!existing) throw new ApiError(404, "Aucune recommandation active.");
  await prisma.mediaRecommendation.delete({ where: { userId } });
};

export const getMyRecommendation = async (userId: string) => {
  return prisma.mediaRecommendation.findUnique({
    where: { userId },
    include: {
      media: { select: { id: true, title: true, slug: true, type: true, synopsis: true, posterPath: true } },
    },
  });
};

export const listAllRecommendations = async () => {
  return prisma.mediaRecommendation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      media: { select: { id: true, title: true, slug: true, type: true, synopsis: true, posterPath: true } },
    },
  });
};
