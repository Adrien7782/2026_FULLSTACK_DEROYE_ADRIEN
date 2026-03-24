import { Router } from "express";
import { z } from "zod";
import { ApiError } from "../../lib/errors.js";
import {
  countUnread,
  listNotifications,
  markAllAsRead,
  markAsRead,
} from "./notifications.service.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", async (req, res) => {
  if (!req.auth) throw new ApiError(401, "Non authentifié");
  const items = await listNotifications(req.auth.user.id);
  const unreadCount = await countUnread(req.auth.user.id);
  res.json({ items, unreadCount });
});

notificationsRouter.get("/unread-count", async (req, res) => {
  if (!req.auth) throw new ApiError(401, "Non authentifié");
  const count = await countUnread(req.auth.user.id);
  res.json({ count });
});

notificationsRouter.patch("/:id/read", async (req, res) => {
  if (!req.auth) throw new ApiError(401, "Non authentifié");
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  await markAsRead(req.auth.user.id, id);
  res.status(204).end();
});

notificationsRouter.post("/read-all", async (req, res) => {
  if (!req.auth) throw new ApiError(401, "Non authentifié");
  await markAllAsRead(req.auth.user.id);
  res.status(204).end();
});
