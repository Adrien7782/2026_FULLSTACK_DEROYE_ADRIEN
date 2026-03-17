import { z } from "zod";

const usernameSchema = z.string().trim().min(3).max(32);
const passwordSchema = z.string().min(8).max(72);

const optionalProfileString = (maxLength: number) =>
  z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }

    return value;
  }, z.string().max(maxLength).nullable().optional());

export const registerSchema = z.object({
  username: usernameSchema,
  email: z.string().trim().email().max(120),
  password: passwordSchema,
  firstName: optionalProfileString(80),
  lastName: optionalProfileString(80),
});

export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const updateProfileSchema = z
  .object({
    username: usernameSchema.optional(),
    email: z.string().trim().email().max(120).optional(),
    firstName: optionalProfileString(80),
    lastName: optionalProfileString(80),
    avatarUrl: z.preprocess((value) => {
      if (value === undefined) {
        return undefined;
      }

      if (value === null) {
        return null;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
      }

      return value;
    }, z.string().url().max(500).nullable().optional()),
    isLikesPrivate: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field must be provided",
  });
