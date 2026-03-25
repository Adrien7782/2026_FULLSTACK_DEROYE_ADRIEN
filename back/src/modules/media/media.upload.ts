import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { ApiError } from "../../lib/errors.js";
import { env } from "../../config/env.js";

const ALLOWED_VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);

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
    throw new ApiError(400, `Le fichier ${kind} référencé est introuvable`);
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
        ? "Format vidéo invalide. Formats acceptés : mp4, webm, mov, m4v"
        : "Format image invalide. Formats acceptés : jpeg, png, gif, webp, svg",
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

// ─── Film directory scan ──────────────────────────────────────────────────────

const FILM_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"]);
const FILM_VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov", ".m4v"]);

export type FilmDirectoryScan = {
  posterRelativePath: string | null;
  videoRelativePath: string | null;
};

const resolveFilmScanDir = (dirPath: string) =>
  isAbsolute(dirPath) ? resolve(dirPath) : resolve(env.DATA_DIRECTORY, dirPath);

export const scanFilmDirectory = (dirPath: string): FilmDirectoryScan => {
  const absDir = resolveFilmScanDir(dirPath);

  if (!existsSync(absDir)) throw new ApiError(400, `Répertoire introuvable : ${dirPath}`);
  if (!statSync(absDir).isDirectory()) throw new ApiError(400, `Ce chemin n'est pas un répertoire : ${dirPath}`);

  const entries = readdirSync(absDir, { withFileTypes: true });

  let posterRelativePath: string | null = null;
  let videoRelativePath: string | null = null;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = extname(entry.name).toLowerCase();
    const nameBase = basename(entry.name, extname(entry.name)).toUpperCase();
    if (nameBase === "POSTER" && FILM_IMAGE_EXTENSIONS.has(ext)) {
      posterRelativePath = relative(env.DATA_DIRECTORY, join(absDir, entry.name)).replace(/\\/g, "/");
    } else if (nameBase === "VIDEO" && FILM_VIDEO_EXTENSIONS.has(ext)) {
      videoRelativePath = relative(env.DATA_DIRECTORY, join(absDir, entry.name)).replace(/\\/g, "/");
    }
  }

  return { posterRelativePath, videoRelativePath };
};

/** Auto-detect video duration in minutes using ffprobe. Returns null if ffprobe is unavailable. */
export const getVideoDuration = (absolutePath: string): number | null => {
  try {
    const result = spawnSync(
      "ffprobe",
      ["-v", "quiet", "-print_format", "json", "-show_format", absolutePath],
      { encoding: "utf-8", timeout: 8000 },
    );

    if (result.status !== 0 || !result.stdout) return null;

    const data = JSON.parse(result.stdout) as { format?: { duration?: string } };
    const durationSeconds = parseFloat(data.format?.duration ?? "");
    if (isNaN(durationSeconds)) return null;

    return Math.max(1, Math.round(durationSeconds / 60));
  } catch {
    return null;
  }
};
