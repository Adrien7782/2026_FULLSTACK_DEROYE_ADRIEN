import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../lib/errors.js";

// Mock prisma before importing the service
const prismaMock = {
  suggestion: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("../../lib/prisma.js", () => ({ prisma: prismaMock }));

// Import AFTER mock is declared
const { cancelSuggestion, createSuggestion, listUserSuggestions, updateSuggestionStatus } =
  await import("./suggestions.service.js");

const USER_ID = "user-1";
const OTHER_USER_ID = "user-2";
const SUGGESTION_ID = "sug-1";

describe("cancelSuggestion", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("deletes a pending suggestion owned by the user", async () => {
    prismaMock.suggestion.findUnique.mockResolvedValue({
      id: SUGGESTION_ID,
      userId: USER_ID,
      status: "pending",
    });
    prismaMock.suggestion.delete.mockResolvedValue({});

    await expect(cancelSuggestion(USER_ID, SUGGESTION_ID)).resolves.toBeUndefined();
    expect(prismaMock.suggestion.delete).toHaveBeenCalledWith({ where: { id: SUGGESTION_ID } });
  });

  it("throws 404 when suggestion does not exist", async () => {
    prismaMock.suggestion.findUnique.mockResolvedValue(null);

    await expect(cancelSuggestion(USER_ID, SUGGESTION_ID)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prismaMock.suggestion.delete).not.toHaveBeenCalled();
  });

  it("throws 403 when user is not the owner", async () => {
    prismaMock.suggestion.findUnique.mockResolvedValue({
      id: SUGGESTION_ID,
      userId: OTHER_USER_ID,
      status: "pending",
    });

    await expect(cancelSuggestion(USER_ID, SUGGESTION_ID)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("throws 400 when suggestion is not pending", async () => {
    prismaMock.suggestion.findUnique.mockResolvedValue({
      id: SUGGESTION_ID,
      userId: USER_ID,
      status: "accepted",
    });

    await expect(cancelSuggestion(USER_ID, SUGGESTION_ID)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe("createSuggestion", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("creates a suggestion with title and synopsis", async () => {
    const expected = { id: SUGGESTION_ID, title: "Inception", synopsis: "Rêves dans les rêves" };
    prismaMock.suggestion.create.mockResolvedValue(expected);

    const result = await createSuggestion(USER_ID, "Inception", "Rêves dans les rêves");

    expect(prismaMock.suggestion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: USER_ID, title: "Inception" }),
      }),
    );
    expect(result).toEqual(expected);
  });

  it("creates a suggestion without synopsis", async () => {
    const expected = { id: SUGGESTION_ID, title: "Inception", synopsis: null };
    prismaMock.suggestion.create.mockResolvedValue(expected);

    await createSuggestion(USER_ID, "Inception");

    expect(prismaMock.suggestion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ synopsis: undefined }),
      }),
    );
  });
});

describe("listUserSuggestions", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns suggestions for the given user", async () => {
    const items = [{ id: "s1", title: "Film A" }, { id: "s2", title: "Film B" }];
    prismaMock.suggestion.findMany.mockResolvedValue(items);

    const result = await listUserSuggestions(USER_ID);

    expect(prismaMock.suggestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } }),
    );
    expect(result).toEqual(items);
  });
});

describe("updateSuggestionStatus", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("updates status to accepted with adminNote", async () => {
    const existing = { id: SUGGESTION_ID, mediaId: null };
    const updated = { id: SUGGESTION_ID, status: "accepted", adminNote: "OK" };
    prismaMock.suggestion.findUnique.mockResolvedValue(existing);
    prismaMock.suggestion.update.mockResolvedValue(updated);

    const result = await updateSuggestionStatus(SUGGESTION_ID, "accepted", "OK");

    expect(prismaMock.suggestion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "accepted", adminNote: "OK" }),
      }),
    );
    expect(result).toEqual(updated);
  });

  it("throws 404 when suggestion does not exist", async () => {
    prismaMock.suggestion.findUnique.mockResolvedValue(null);

    await expect(updateSuggestionStatus(SUGGESTION_ID, "accepted")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("links a mediaId when provided", async () => {
    const existing = { id: SUGGESTION_ID, mediaId: null };
    prismaMock.suggestion.findUnique.mockResolvedValue(existing);
    prismaMock.suggestion.update.mockResolvedValue({ id: SUGGESTION_ID, status: "processed", mediaId: "media-1" });

    await updateSuggestionStatus(SUGGESTION_ID, "processed", undefined, "media-1");

    expect(prismaMock.suggestion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ mediaId: "media-1" }),
      }),
    );
  });
});
