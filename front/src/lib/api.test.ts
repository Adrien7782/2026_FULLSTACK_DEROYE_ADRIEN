import { describe, expect, it } from "vitest";
import { ApiClientError, getMediaPosterUrl, getMediaStreamUrl } from "./api";

describe("ApiClientError", () => {
  it("creates an error with status and message", () => {
    const err = new ApiClientError("Not found", 404);
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.name).toBe("ApiClientError");
    expect(err instanceof Error).toBe(true);
  });

  it("stores optional details", () => {
    const err = new ApiClientError("Validation failed", 400, { field: "email" });
    expect(err.details).toEqual({ field: "email" });
  });
});

describe("getMediaPosterUrl", () => {
  it("returns the poster URL for a given slug", () => {
    const url = getMediaPosterUrl("inception-2010");
    expect(url).toContain("/media/inception-2010/poster");
  });

  it("URL-encodes special characters in the slug", () => {
    const url = getMediaPosterUrl("l'aventurier");
    expect(url).toContain(encodeURIComponent("l'aventurier"));
  });
});

describe("getMediaStreamUrl", () => {
  it("returns the stream URL for a given slug", () => {
    const url = getMediaStreamUrl("blade-runner-2049");
    expect(url).toContain("/media/blade-runner-2049/stream");
  });
});
