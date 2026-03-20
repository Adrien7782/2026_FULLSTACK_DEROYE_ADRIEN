import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/errors.js";

export const cancelSuggestion = async (userId: string, id: string) => {
  const row = await prisma.suggestion.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, "Suggestion introuvable");
  if (row.userId !== userId) throw new ApiError(403, "Action non autorisée");
  if (row.status !== "pending") throw new ApiError(400, "Seules les suggestions en attente peuvent être annulées");
  await prisma.suggestion.delete({ where: { id } });
};

export const createSuggestion = async (userId: string, title: string, synopsis?: string) => {
  return prisma.suggestion.create({
    data: { userId, title, synopsis },
    include: { user: { select: { id: true, username: true, avatarUrl: true } } },
  });
};

export const listUserSuggestions = async (userId: string) => {
  return prisma.suggestion.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { media: { select: { id: true, slug: true, title: true } } },
  });
};

export const listAllSuggestions = async (status?: string) => {
  return prisma.suggestion.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      media: { select: { id: true, slug: true, title: true } },
    },
  });
};

export const updateSuggestionStatus = async (
  id: string,
  status: "accepted" | "refused" | "processed",
  adminNote?: string,
  mediaId?: string,
) => {
  const suggestion = await prisma.suggestion.findUnique({ where: { id } });
  if (!suggestion) throw new ApiError(404, "Suggestion introuvable");
  return prisma.suggestion.update({
    where: { id },
    data: { status, adminNote, mediaId: mediaId ?? suggestion.mediaId },
    include: {
      user: { select: { id: true, username: true, avatarUrl: true } },
      media: { select: { id: true, slug: true, title: true } },
    },
  });
};
