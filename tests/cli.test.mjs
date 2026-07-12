import { describe, expect, it, vi } from "vitest";
import { runCli } from "../src/cli.mjs";

const markdown = `---
title: Dry run
tags: [learn]
---

Body.
`;

function harness(overrides = {}) {
  const output = [];
  const errors = [];
  return {
    output,
    errors,
    dependencies: {
      env: {},
      fetchImpl: vi.fn(),
      readFile: vi.fn().mockResolvedValue(markdown),
      stdout: (message) => output.push(message),
      stderr: (message) => errors.push(message),
      ...overrides,
    },
  };
}

describe("CLI exit and secret handling", () => {
  it("dry-runs without network or a token", async () => {
    const test = harness();
    await expect(runCli(["publish", "post.md", "--dry-run"], test.dependencies)).resolves.toBe(0);
    expect(test.dependencies.fetchImpl).not.toHaveBeenCalled();
    expect(JSON.parse(test.output[0])).toEqual({ title: "Dry run", contentMd: "\nBody.\n", tags: ["learn"] });
  });

  it("returns exit 1 for a missing token without echoing environment values", async () => {
    const marker = "never-print-this-marker";
    const test = harness({ env: { UNRELATED_SECRET: marker } });
    await expect(runCli(["whoami"], test.dependencies)).resolves.toBe(1);
    expect(test.errors.join("\n")).toContain("INVOLUTIONHELL_SATOKEN is not set");
    expect(test.errors.join("\n")).not.toContain(marker);
  });

  it("returns exit 2 for an API failure", async () => {
    const test = harness({
      env: { INVOLUTIONHELL_SATOKEN: "never-print-this-token" },
      fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    });
    await expect(runCli(["whoami"], test.dependencies)).resolves.toBe(2);
    expect(test.errors.join("\n")).toContain("HTTP 503");
    expect(test.errors.join("\n")).not.toContain("never-print-this-token");
  });
});
