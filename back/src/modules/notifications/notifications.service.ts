import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/errors.js";
import type { NotificationType } from "../../generated/prisma/client.js";

export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string,
) => {
  return prisma.notification.create({
    data: { userId, type, title, body, link },
  });
};

export const listNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true, type: true, title: true, body: true, isRead: true, link: true, createdAt: true,
    },
  });
};

export const countUnread = async (userId: string) => {
  return prisma.notification.count({ where: { userId, isRead: false } });
};

export const markAsRead = async (userId: string, notificationId: string) => {
  const notif = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notif) throw new ApiError(404, "Notification introuvable");
  if (notif.userId !== userId) throw new ApiError(403, "Accès refusé");

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};
