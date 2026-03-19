import { Router } from "express";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { requireAdmin, requireAuth } from "../modules/auth/auth.middleware.js";
import { interactionsRouter } from "../modules/interactions/interactions.routes.js";
import { mediaRouter } from "../modules/media/media.routes.js";
import { suggestionsRouter } from "../modules/suggestions/suggestions.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.status(200).json({
    message: "StreamAdy API root",
    modules: ["auth", "users", "media", "suggestions", "admin", "interactions"],
  });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/media", requireAuth, mediaRouter);
apiRouter.use("/suggestions", requireAuth, suggestionsRouter);
apiRouter.use("/admin", requireAuth, requireAdmin, adminRouter);
apiRouter.use("/me", requireAuth, interactionsRouter);
