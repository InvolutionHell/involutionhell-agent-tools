import { describe, expect, it } from "vitest";
import { mapApiError, mapNetworkError, missingTokenMessage } from "../src/errors.mjs";

describe("error mapping", () => {
  it("maps authentication and slug failures", () => {
    expect(mapApiError(401, "publish")).toContain("expired or invalid");
    expect(mapApiError(403, "whoami")).toContain("expired or invalid");
    expect(mapApiError(409, "publish")).toContain("slug already exists");
  });

  it("maps timeouts without including the underlying error", () => {
    const error = Object.assign(new Error("secret transport detail"), { name: "TimeoutError" });
    expect(mapNetworkError(error, "publish")).toBe("Timed out while trying to publish the post. Try again later.");
  });

  it("explains token setup without containing a token value", () => {
    expect(missingTokenMessage()).toContain("INVOLUTIONHELL_SATOKEN");
    expect(missingTokenMessage()).toContain("Log in at https://involutionhell.com");
  });
});
