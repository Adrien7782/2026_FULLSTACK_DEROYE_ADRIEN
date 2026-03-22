import { describe, expect, it, vi } from "vitest";

// Mock prisma and env dependencies not needed for pure function tests
vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    session: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    user: { findFirst: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock("../../config/env.js", () => ({
  env: {
    SESSION_COOKIE_NAME: "session",
    SESSION_COOKIE_SECURE: false,
    SESSION_TTL_DAYS: 30,
    BCRYPT_ROUNDS: 10,
  },
}));

const { createPasswordHash, verifyPassword } = await import("./auth.service.js");

describe("createPasswordHash", () => {
  it("returns a bcrypt hash string", async () => {
    const hash = await createPasswordHash("mypassword123");
    expect(typeof hash).toBe("string");
    expect(hash).toMatch(/^\$2[ab]\$/);
    expect(hash.length).toBeGreaterThan(50);
  });

  it("returns different hashes for the same password", async () => {
    const hash1 = await createPasswordHash("mypassword123");
    const hash2 = await createPasswordHash("mypassword123");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("returns true for a matching password", async () => {
    const hash = await createPasswordHash("correct-password");
    const result = await verifyPassword("correct-password", hash);
    expect(result).toBe(true);
  });

  it("returns false for a wrong password", async () => {
    const hash = await createPasswordHash("correct-password");
    const result = await verifyPassword("wrong-password", hash);
    expect(result).toBe(false);
  });

  it("returns false for an empty string", async () => {
    const hash = await createPasswordHash("correct-password");
    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });
});
