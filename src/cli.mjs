import { promises as nodeFs } from "node:fs";
import { parseCliArgs, USAGE } from "./args.mjs";
import { publishPost, whoAmI } from "./api.mjs";
import { loadIndexDump } from "./cache.mjs";
import { RemoteError, UserError } from "./errors.mjs";
import { buildPublishPayload } from "./frontmatter.mjs";
import { searchDump } from "./search.mjs";

function humanSearchOutput(results) {
  if (results.length === 0) return "No results found.";
  return results.map((result, index) => {
    const snippet = result.snippet || result.description || "";
    return `${index + 1}. ${result.title}\n   ${result.url}${snippet ? `\n   ${snippet}` : ""}`;
  }).join("\n\n");
}

async function execute(parsed, dependencies) {
  const { env, fetchImpl, fsImpl, readFile, stdout } = dependencies;
  if (parsed.command === "help") {
    stdout(USAGE);
    return;
  }
  if (parsed.command === "search") {
    const siteUrl = env.INVOLUTIONHELL_SITE_URL ?? "https://involutionhell.com";
    const dump = await loadIndexDump({
      locale: parsed.locale,
      noCache: parsed.noCache,
      siteUrl,
      fetchImpl,
      fsImpl,
      env,
    });
    const results = await searchDump(dump, { ...parsed, siteUrl });
    stdout(parsed.json ? JSON.stringify(results, null, 2) : humanSearchOutput(results));
    return;
  }
  if (parsed.command === "publish") {
    let markdown;
    try {
      markdown = await readFile(parsed.file, "utf8");
    } catch {
      throw new UserError(`Could not read Markdown file: ${parsed.file}`);
    }
    const payload = buildPublishPayload(markdown, parsed);
    if (parsed.dryRun) {
      stdout(JSON.stringify(payload, null, 2));
      return;
    }
    stdout(await publishPost(payload, { env, fetchImpl }));
    return;
  }
  stdout(await whoAmI({ env, fetchImpl }));
}

export async function runCli(argv, overrides = {}) {
  const dependencies = {
    env: process.env,
    fetchImpl: fetch,
    fsImpl: nodeFs,
    readFile: nodeFs.readFile,
    stdout: (message) => console.log(message),
    stderr: (message) => console.error(message),
    ...overrides,
  };
  try {
    await execute(parseCliArgs(argv), dependencies);
    return 0;
  } catch (error) {
    if (error instanceof UserError) {
      dependencies.stderr(error.message);
      return 1;
    }
    if (error instanceof RemoteError) {
      dependencies.stderr(error.message);
      return 2;
    }
    dependencies.stderr("Unexpected CLI failure. Try again or report this issue.");
    return 2;
  }
}
