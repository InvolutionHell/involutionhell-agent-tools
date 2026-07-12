import matter from "gray-matter";
import { UserError } from "./errors.mjs";

function choose(override, frontmatterValue) {
  return override === undefined ? frontmatterValue : override;
}

function optionalString(value, field) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new UserError(`${field} must be a string.`);
  return value.trim();
}

function normalizeTags(value) {
  if (value === undefined || value === null) return undefined;
  const tags = typeof value === "string" ? value.split(",") : value;
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
    throw new UserError("tags must be an array or a comma-separated string.");
  }
  return tags.map((tag) => tag.trim()).filter(Boolean);
}

function validatePayload(payload) {
  if (!payload.title) throw new UserError("A title is required via frontmatter or --title.");
  if (payload.title.length > 200) throw new UserError("title must be at most 200 characters.");
  if (!payload.contentMd.trim()) throw new UserError("The Markdown body must not be empty.");
  if (payload.contentMd.length > 100_000) throw new UserError("The Markdown body must be at most 100,000 characters.");
  if (payload.description !== undefined && payload.description.length > 500) {
    throw new UserError("description must be at most 500 characters.");
  }
  if (payload.tags !== undefined) {
    if (payload.tags.length > 10) throw new UserError("tags must contain at most 10 entries.");
    if (payload.tags.some((tag) => tag.length > 50)) {
      throw new UserError("each tag must be at most 50 characters.");
    }
  }
  if (payload.slug !== undefined && (!payload.slug || payload.slug.length > 100)) {
    throw new UserError("slug must contain 1 to 100 characters.");
  }
}

export function buildPublishPayload(markdown, overrides = {}) {
  let parsed;
  try {
    parsed = matter(markdown);
  } catch {
    throw new UserError("The Markdown frontmatter is not valid YAML.");
  }

  const title = optionalString(choose(overrides.title, parsed.data.title), "title");
  const description = optionalString(choose(overrides.description, parsed.data.description), "description");
  const tags = normalizeTags(choose(overrides.tags, parsed.data.tags));
  const slug = optionalString(choose(overrides.slug, parsed.data.slug), "slug");
  const payload = {
    title,
    contentMd: parsed.content,
    ...(description === undefined ? {} : { description }),
    ...(tags === undefined ? {} : { tags }),
    ...(slug === undefined ? {} : { slug }),
  };
  validatePayload(payload);
  return payload;
}
