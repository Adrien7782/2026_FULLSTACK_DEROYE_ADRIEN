import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../lib/errors.js";
import { clearSessionCookie, resolveAuthContext } from "./auth.service.js";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authContext = await resolveAuthContext(req);

    if (!authContext) {
      clearSessionCookie(res);
      next(new ApiError(401, "Authentication required"));
      return;
    }

    req.auth = authContext;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.auth) {
    next(new ApiError(401, "Authentication required"));
    return;
  }

  if (req.auth.user.role !== "admin") {
    next(new ApiError(403, "Admin role required"));
    return;
  }

  next();
};
