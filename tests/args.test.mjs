import { describe, expect, it } from "vitest";
import { parseCliArgs } from "../src/args.mjs";

describe("parseCliArgs", () => {
  it("parses search defaults", () => {
    expect(parseCliArgs(["search", "数组"])).toEqual({
      command: "search",
      query: "数组",
      locale: "zh",
      limit: 8,
      json: false,
      noCache: false,
    });
  });

  it("parses search options in any position", () => {
    expect(parseCliArgs(["search", "--locale=en", "dynamic array", "--limit", "3", "--json", "--no-cache"])).toMatchObject({
      locale: "en",
      limit: 3,
      json: true,
      noCache: true,
    });
  });

  it("parses publish flags and comma-separated tags", () => {
    expect(parseCliArgs(["publish", "post.md", "--tags", "learn, cs", "--dry-run"])).toMatchObject({
      file: "post.md",
      tags: ["learn", "cs"],
      dryRun: true,
    });
  });

  it("rejects unknown and invalid options", () => {
    expect(() => parseCliArgs(["publish", "post.md", "--token", "secret"])).toThrow("Unknown option: --token");
    expect(() => parseCliArgs(["search", "x", "--limit", "0"])).toThrow("--limit must be an integer from 1 to 20");
    expect(() => parseCliArgs(["search", "x", "--locale", "fr"])).toThrow("--locale must be zh or en");
  });
});
