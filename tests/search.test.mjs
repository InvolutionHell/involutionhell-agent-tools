import { describe, expect, it } from "vitest";
import { createFabricatedDump } from "./fixtures/fabricated-dump.mjs";
import { restoreSearchIndex, searchDump } from "../src/search.mjs";

describe("Orama dump restore and page shaping", () => {
  it("restores a Mandarin dump and groups hits per page", async () => {
    const dump = await createFabricatedDump("zh");
    expect(restoreSearchIndex(dump, "zh")).toBeTruthy();
    const results = await searchDump(dump, { query: "动态数组", locale: "zh", limit: 2, siteUrl: "https://example.test" });
    expect(results[0]).toEqual({
      title: "动态数组指南",
      url: "https://example.test/zh/docs/array",
      description: "介绍数组扩容、摊还复杂度与工程权衡。",
      snippet: "动态数组通常在容量不足时进行倍增扩容。",
    });
    expect(new Set(results.map((result) => result.url)).size).toBe(results.length);
  });

  it("restores and searches an English dump", async () => {
    const dump = await createFabricatedDump("en");
    const results = await searchDump(dump, { query: "dynamic array", locale: "en", limit: 3 });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Dynamic Array Guide");
  });
});
