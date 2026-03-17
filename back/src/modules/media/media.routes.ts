import { Router } from "express";

export const mediaRouter = Router();

mediaRouter.get("/", (req, res) => {
  res.status(200).json({
    module: "media",
    status: "protected",
    message: `Authenticated access granted for ${req.auth?.user.username ?? "unknown user"}`,
  });
});
