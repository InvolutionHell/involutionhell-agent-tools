import { describe, expect, it, vi } from "vitest";
import { CACHE_TTL_MS, cacheFilePath, isCacheFresh, loadIndexDump } from "../src/cache.mjs";

const dump = { type: "advanced", internalDocumentIDStore: {}, index: {}, docs: {}, sorting: {}, pinning: {}, language: "english" };

describe("search index cache", () => {
  it("uses XDG_CACHE_HOME and applies a one-hour TTL", () => {
    expect(cacheFilePath("zh", { env: { XDG_CACHE_HOME: "/tmp/xdg" }, homeDir: "/home/test" })).toBe("/tmp/xdg/involutionhell/search.zh.json");
    expect(isCacheFresh({ mtimeMs: 1_000 }, 1_000 + CACHE_TTL_MS - 1)).toBe(true);
    expect(isCacheFresh({ mtimeMs: 1_000 }, 1_000 + CACHE_TTL_MS)).toBe(false);
  });

  it("reads a fresh cache without fetching", async () => {
    const fetchImpl = vi.fn();
    const fsImpl = {
      stat: vi.fn().mockResolvedValue({ mtimeMs: 9_000 }),
      readFile: vi.fn().mockResolvedValue(JSON.stringify(dump)),
    };
    await expect(loadIndexDump({ locale: "en", fetchImpl, fsImpl, now: () => 10_000, env: {}, homeDir: "/home/test" })).resolves.toEqual(dump);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refreshes a stale cache and writes the downloaded dump", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify(dump) });
    const fsImpl = {
      stat: vi.fn().mockResolvedValue({ mtimeMs: 0 }),
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      rename: vi.fn().mockResolvedValue(undefined),
    };
    await expect(loadIndexDump({ locale: "en", fetchImpl, fsImpl, now: () => CACHE_TTL_MS + 1, env: {}, homeDir: "/home/test" })).resolves.toEqual(dump);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fsImpl.writeFile).toHaveBeenCalledOnce();
  });
});
