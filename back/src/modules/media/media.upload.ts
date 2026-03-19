import { existsSync, mkdirSync, statSync } from "node:fs";
import { basename, extname, isAbsolute, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";
import { ApiError } from "../../lib/errors.js";
import { env } from "../../config/env.js";

export const UPLOAD_MAX_VIDEO_BYTES = env.UPLOAD_MAX_VIDEO_MB * 1024 * 1024;
export const UPLOAD_MAX_IMAGE_BYTES = env.UPLOAD_MAX_IMAGE_MB * 1024 * 1024;

const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
]);

const ALLOWED_VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v"]);

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);

const videosDir = join(env.DATA_DIRECTORY, "videos");
const postersDir = join(env.DATA_DIRECTORY, "posters");

if (!existsSync(videosDir)) mkdirSync(videosDir, { recursive: true });
if (!existsSync(postersDir)) mkdirSync(postersDir, { recursive: true });

const toStorageFileName = (originalName: string) => {
  const ext = extname(originalName).toLowerCase() || ".bin";
  const rawBaseName = basename(originalName, ext);
  const normalizedBaseName = rawBaseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const safeBaseName = normalizedBaseName || "media";
  const shortId = randomUUID().slice(0, 8);

  return `${safeBaseName}-${shortId}${ext}`;
};

const normalizeRelativeStoragePath = (inputPath: string) =>
  inputPath.replace(/\\/g, "/").replace(/^\/+/, "");

export const validateReferencedMediaPath = (
  rawPath: string,
  kind: "video" | "poster",
) => {
  const submittedPath = rawPath.trim();

  if (!submittedPath) {
    throw new ApiError(400, `Chemin ${kind} invalide`);
  }

  const resolvedPath = isAbsolute(submittedPath)
    ? resolve(submittedPath)
    : resolve(env.DATA_DIRECTORY, submittedPath);

  if (!existsSync(resolvedPath)) {
    throw new ApiError(400, `Le fichier ${kind} reference est introuvable`);
  }

  const fileStats = statSync(resolvedPath);
  if (!fileStats.isFile()) {
    throw new ApiError(400, `Le chemin ${kind} doit pointer vers un fichier`);
  }

  const extension = extname(resolvedPath).toLowerCase();
  const allowedExtensions =
    kind === "video" ? ALLOWED_VIDEO_EXTENSIONS : ALLOWED_IMAGE_EXTENSIONS;

  if (!allowedExtensions.has(extension)) {
    throw new ApiError(
      400,
      kind === "video"
        ? "Format video invalide. Formats acceptes: mp4, webm, mov, m4v"
        : "Format image invalide. Formats acceptes: jpeg, png, gif, webp, svg",
    );
  }

  return isAbsolute(submittedPath) ? resolvedPath : normalizeRelativeStoragePath(submittedPath);
};

export const resolveManagedStoragePath = (storedPath: string) => {
  if (isAbsolute(storedPath)) {
    return resolve(storedPath);
  }

  const absolutePath = resolve(env.DATA_DIRECTORY, storedPath);
  const normalizedDataDirectory = `${env.DATA_DIRECTORY}${sep}`;

  if (!absolutePath.startsWith(normalizedDataDirectory) && absolutePath !== env.DATA_DIRECTORY) {
    throw new ApiError(400, "Invalid media path");
  }

  return absolutePath;
};

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    cb(null, file.fieldname === "video" ? videosDir : postersDir);
  },
  filename: (_req, file, cb) => {
    cb(null, toStorageFileName(file.originalname));
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.fieldname === "video") {
    if (ALLOWED_VIDEO_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type video invalide: ${file.mimetype}. Formats acceptes: mp4, webm, mov, m4v`));
    }
  } else if (file.fieldname === "poster") {
    if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type image invalide: ${file.mimetype}. Formats acceptes: jpeg, png, gif, webp, svg`));
    }
  } else {
    cb(new Error(`Champ de fichier inconnu: ${file.fieldname}`));
  }
};

// Pas de limite fileSize ici : multer écrit directement sur disque (disk storage),
// la vérification de taille se fait dans le handler après réception du fichier.
export const mediaUpload = multer({
  storage,
  fileFilter,
  limits: { files: 2 },
});
