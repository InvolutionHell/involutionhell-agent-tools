import { describe, expect, it, vi } from "vitest";
import { publishPost, whoAmI } from "../src/api.mjs";

describe("API client", () => {
  it("publishes with satoken in a header and returns the public URL", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { slug: "hello", authorUsername: "alice", title: "Hello" } }),
    });
    await expect(publishPost({ title: "Hello", contentMd: "Body" }, {
      env: { INVOLUTIONHELL_SATOKEN: "test-token" },
      fetchImpl,
    })).resolves.toBe("https://involutionhell.com/u/alice/posts/hello");
    const [, request] = fetchImpl.mock.calls[0];
    expect(request.headers.satoken).toBe("test-token");
    expect(request.body).not.toContain("test-token");
  });

  it("prints a username from /auth/me", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { id: 1, username: "alice" } }) });
    await expect(whoAmI({ env: { INVOLUTIONHELL_SATOKEN: "test-token" }, fetchImpl })).resolves.toBe("alice");
  });

  it("requires an environment token", async () => {
    await expect(whoAmI({ env: {}, fetchImpl: vi.fn() })).rejects.toThrow("INVOLUTIONHELL_SATOKEN is not set");
  });
});
