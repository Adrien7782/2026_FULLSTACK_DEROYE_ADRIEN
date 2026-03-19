import { createReadStream, existsSync, statSync } from "node:fs";
import type { Request, Response } from "express";
import { ApiError } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";
import { resolveManagedStoragePath } from "./media.upload.js";

type ViewerRole = "standard" | "admin" | undefined;

const detectContentType = (relativePath: string) => {
  const normalizedPath = relativePath.toLowerCase();

  if (normalizedPath.endsWith(".svg")) {
    return "image/svg+xml";
  }

  if (normalizedPath.endsWith(".png")) {
    return "image/png";
  }

  if (normalizedPath.endsWith(".jpg") || normalizedPath.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (normalizedPath.endsWith(".mp4")) {
    return "video/mp4";
  }

  if (normalizedPath.endsWith(".webm")) {
    return "video/webm";
  }

  if (normalizedPath.endsWith(".mov")) {
    return "video/quicktime";
  }

  if (normalizedPath.endsWith(".m4v")) {
    return "video/x-m4v";
  }

  return "application/octet-stream";
};

export const sendPosterAsset = async (slug: string, res: Response, viewerRole?: ViewerRole) => {
  const media = await prisma.media.findFirst({
    where: {
      slug,
      ...(viewerRole === "admin" ? {} : { status: "published" }),
    },
    select: {
      posterPath: true,
    },
  });

  if (!media) {
    throw new ApiError(404, "Media not found");
  }

  if (!media.posterPath) {
    throw new ApiError(404, "Poster not found");
  }

  const absolutePath = resolveManagedStoragePath(media.posterPath);

  if (!existsSync(absolutePath)) {
    throw new ApiError(404, "Poster file is missing on disk");
  }

  res.setHeader("Content-Type", detectContentType(media.posterPath));
  res.setHeader("Cache-Control", "private, max-age=300");
  createReadStream(absolutePath).pipe(res);
};

const parseByteRange = (rangeHeader: string, fileSize: number) => {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader.trim());

  if (!match) {
    throw new ApiError(416, "Invalid Range header");
  }

  const rawStart = match[1];
  const rawEnd = match[2];

  if (!rawStart && !rawEnd) {
    throw new ApiError(416, "Invalid Range header");
  }

  let start = rawStart ? Number.parseInt(rawStart, 10) : Number.NaN;
  let end = rawEnd ? Number.parseInt(rawEnd, 10) : Number.NaN;

  if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
    throw new ApiError(416, "Invalid byte range");
  }

  if (Number.isNaN(start)) {
    const suffixLength = end;

    if (!Number.isInteger(suffixLength) || suffixLength <= 0) {
      throw new ApiError(416, "Invalid byte range");
    }

    start = Math.max(fileSize - suffixLength, 0);
    end = fileSize - 1;
  } else {
    end = Number.isNaN(end) ? fileSize - 1 : Math.min(end, fileSize - 1);
  }

  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= fileSize) {
    throw new ApiError(416, "Requested range is not satisfiable");
  }

  return { start, end };
};

export const sendVideoStream = async (
  slug: string,
  req: Request,
  res: Response,
  viewerRole?: ViewerRole,
) => {
  const media = await prisma.media.findFirst({
    where: {
      slug,
      ...(viewerRole === "admin" ? {} : { status: "published" }),
    },
    select: {
      videoPath: true,
    },
  });

  if (!media) {
    throw new ApiError(404, "Media not found");
  }

  if (!media.videoPath) {
    throw new ApiError(404, "Video file not configured for this media");
  }

  const absolutePath = resolveManagedStoragePath(media.videoPath);

  if (!existsSync(absolutePath)) {
    throw new ApiError(404, "Video file is missing on disk");
  }

  const fileStats = statSync(absolutePath);

  if (!fileStats.isFile()) {
    throw new ApiError(404, "Video path does not point to a file");
  }

  const contentType = detectContentType(media.videoPath);
  const rawRange = Array.isArray(req.headers.range) ? req.headers.range[0] : req.headers.range;

  res.setHeader("Content-Type", contentType);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");

  if (!rawRange) {
    res.status(200);
    res.setHeader("Content-Length", fileStats.size);
    createReadStream(absolutePath).pipe(res);
    return;
  }

  const { start, end } = parseByteRange(rawRange, fileStats.size);
  const chunkSize = end - start + 1;

  res.status(206);
  res.setHeader("Content-Range", `bytes ${start}-${end}/${fileStats.size}`);
  res.setHeader("Content-Length", chunkSize);

  createReadStream(absolutePath, { start, end }).pipe(res);
};
