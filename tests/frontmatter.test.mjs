import { describe, expect, it } from "vitest";
import { buildPublishPayload } from "../src/frontmatter.mjs";

const markdown = `---
title: Frontmatter title
description: Frontmatter description
tags: [learn, ai]
slug: frontmatter-slug
---
# Body

Useful content.
`;

describe("buildPublishPayload", () => {
  it("removes frontmatter and uses its metadata", () => {
    const payload = buildPublishPayload(markdown);
    expect(payload).toMatchObject({
      title: "Frontmatter title",
      description: "Frontmatter description",
      tags: ["learn", "ai"],
      slug: "frontmatter-slug",
    });
    expect(payload.contentMd).toContain("# Body");
    expect(payload.contentMd).not.toContain("Frontmatter title");
  });

  it("lets flags override every frontmatter field", () => {
    expect(buildPublishPayload(markdown, {
      title: "Flag title",
      description: "Flag description",
      tags: ["cs"],
      slug: "flag-slug",
    })).toMatchObject({
      title: "Flag title",
      description: "Flag description",
      tags: ["cs"],
      slug: "flag-slug",
    });
  });

  it("requires a title and non-empty body", () => {
    expect(() => buildPublishPayload("Body only")).toThrow("A title is required");
    expect(() => buildPublishPayload("---\ntitle: Empty\n---\n")).toThrow("must not be empty");
  });
});
