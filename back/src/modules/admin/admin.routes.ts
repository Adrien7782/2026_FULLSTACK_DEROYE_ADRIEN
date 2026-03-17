import { Router } from "express";

export const adminRouter = Router();

adminRouter.get("/", (req, res) => {
  res.status(200).json({
    module: "admin",
    status: "protected",
    message: `Admin access granted for ${req.auth?.user.username ?? "unknown user"}`,
  });
});
