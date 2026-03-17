import { Router } from "express";

export const suggestionsRouter = Router();

suggestionsRouter.get("/", (req, res) => {
  res.status(200).json({
    module: "suggestions",
    status: "protected",
    message: `Authenticated access granted for ${req.auth?.user.username ?? "unknown user"}`,
  });
});
