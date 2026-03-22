import { describe, expect, it } from "vitest";
import { ApiError, isApiError } from "./errors.js";

describe("ApiError", () => {
  it("creates an error with statusCode and message", () => {
    const error = new ApiError(404, "Resource not found");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Resource not found");
    expect(error.name).toBe("ApiError");
    expect(error instanceof Error).toBe(true);
  });

  it("stores optional details", () => {
    const details = { field: "email", reason: "invalid format" };
    const error = new ApiError(400, "Validation failed", details);
    expect(error.details).toEqual(details);
  });

  it("works without details", () => {
    const error = new ApiError(500, "Internal error");
    expect(error.details).toBeUndefined();
  });

  it("is instanceof Error", () => {
    const error = new ApiError(401, "Unauthorized");
    expect(error instanceof Error).toBe(true);
  });
});

describe("isApiError", () => {
  it("returns true for ApiError instances", () => {
    expect(isApiError(new ApiError(400, "Bad request"))).toBe(true);
  });

  it("returns false for plain errors", () => {
    expect(isApiError(new Error("generic"))).toBe(false);
  });

  it("returns false for non-error values", () => {
    expect(isApiError("string")).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(42)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
  });
});
