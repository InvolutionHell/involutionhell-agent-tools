import { promises as nodeFs } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { RemoteError, mapNetworkError } from "./errors.mjs";

export const CACHE_TTL_MS = 60 * 60 * 1_000;

function baseUrl(value) {
  return value.replace(/\/+$/, "");
}

export function cacheFilePath(locale, { env = process.env, homeDir = homedir() } = {}) {
  const root = env.XDG_CACHE_HOME || path.join(homeDir, ".cache");
  return path.join(root, "involutionhell", `search.${locale}.json`);
}

export function isCacheFresh(stat, nowMs, ttlMs = CACHE_TTL_MS) {
  return Number.isFinite(stat?.mtimeMs) && nowMs - stat.mtimeMs >= 0 && nowMs - stat.mtimeMs < ttlMs;
}

function parseDump(text) {
  let dump;
  try {
    dump = JSON.parse(text);
  } catch {
    throw new RemoteError("InvolutionHell returned an invalid search index.");
  }
  if (dump?.type !== "advanced" || !dump.internalDocumentIDStore || !dump.index || !dump.docs) {
    throw new RemoteError("InvolutionHell returned an unsupported search index.");
  }
  return dump;
}

export async function loadIndexDump({
  locale,
  noCache = false,
  siteUrl = process.env.INVOLUTIONHELL_SITE_URL ?? "https://involutionhell.com",
  fetchImpl = fetch,
  fsImpl = nodeFs,
  now = Date.now,
  env = process.env,
  homeDir = homedir(),
}) {
  const file = cacheFilePath(locale, { env, homeDir });
  if (!noCache) {
    try {
      const stat = await fsImpl.stat(file);
      if (isCacheFresh(stat, now())) {
        return parseDump(await fsImpl.readFile(file, "utf8"));
      }
    } catch {
      // A missing, unreadable, or invalid cache is refreshed below.
    }
  }

  let response;
  try {
    response = await fetchImpl(`${baseUrl(siteUrl)}/search.${locale}.json`, {
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    throw new RemoteError(mapNetworkError(error, "search"));
  }
  if (!response.ok) {
    throw new RemoteError(`Could not download the ${locale} search index (HTTP ${response.status}).`);
  }

  const text = await response.text();
  const dump = parseDump(text);
  try {
    await fsImpl.mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    await fsImpl.writeFile(temporary, text, "utf8");
    await fsImpl.rename(temporary, file);
  } catch {
    // Search can still proceed when the local cache is not writable.
  }
  return dump;
}
