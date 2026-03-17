import { Router } from "express";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { updateProfileSchema } from "../auth/auth.schemas.js";
import { getAuthContext, publicUserSelect } from "../auth/auth.service.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", (_req, res) => {
  res.status(200).json({
    module: "users",
    availableRoutes: ["GET /api/users/me", "PATCH /api/users/me"],
  });
});

usersRouter.get("/me", (req, res) => {
  const auth = getAuthContext(req);

  res.status(200).json({
    user: auth.user,
    session: auth.session,
  });
});

usersRouter.patch("/me", async (req, res) => {
  const auth = getAuthContext(req);
  const input = updateProfileSchema.parse(req.body);
  const uniqueConstraints: Array<{ username: string } | { email: string }> = [];

  if (input.username) {
    uniqueConstraints.push({ username: input.username });
  }

  if (input.email) {
    uniqueConstraints.push({ email: input.email });
  }

  if (uniqueConstraints.length > 0) {
    const conflict = await prisma.user.findFirst({
      where: {
        id: {
          not: auth.user.id,
        },
        OR: uniqueConstraints,
      },
      select: {
        username: true,
        email: true,
      },
    });

    if (conflict?.username === input.username) {
      throw new ApiError(409, "Username already in use");
    }

    if (conflict?.email === input.email) {
      throw new ApiError(409, "Email already in use");
    }
  }

  const user = await prisma.user.update({
    where: {
      id: auth.user.id,
    },
    data: {
      username: input.username,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      avatarUrl: input.avatarUrl,
      isLikesPrivate: input.isLikesPrivate,
    },
    select: publicUserSelect,
  });

  req.auth = {
    ...auth,
    user,
  };

  res.status(200).json({
    message: "Profile updated",
    user,
    session: auth.session,
  });
});
