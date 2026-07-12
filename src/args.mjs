import { UserError } from "./errors.mjs";

export const USAGE = `Usage:
  involutionhell search <query> [--locale zh|en] [--limit N] [--json] [--no-cache]
  involutionhell publish <file.md> [--title TEXT] [--description TEXT] [--tags a,b] [--slug SLUG] [--dry-run]
  involutionhell whoami

Environment:
  INVOLUTIONHELL_SATOKEN  Required for publish and whoami
  INVOLUTIONHELL_SITE_URL Override https://involutionhell.com
  INVOLUTIONHELL_API_URL  Override https://api.involutionhell.com`;

const optionDefinitions = {
  search: {
    "--locale": { key: "locale", value: true },
    "--limit": { key: "limit", value: true },
    "--json": { key: "json", value: false },
    "--no-cache": { key: "noCache", value: false },
  },
  publish: {
    "--title": { key: "title", value: true },
    "--description": { key: "description", value: true },
    "--tags": { key: "tags", value: true },
    "--slug": { key: "slug", value: true },
    "--dry-run": { key: "dryRun", value: false },
  },
  whoami: {},
};

function parseOptions(tokens, definitions) {
  const options = {};
  const positionals = [];
  let positionalOnly = false;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--") {
      positionalOnly = true;
      continue;
    }
    if (!positionalOnly && token.startsWith("-")) {
      const equalsAt = token.indexOf("=");
      const name = equalsAt === -1 ? token : token.slice(0, equalsAt);
      const inlineValue = equalsAt === -1 ? undefined : token.slice(equalsAt + 1);
      const definition = definitions[name];
      if (!definition) throw new UserError(`Unknown option: ${name}`);
      if (Object.hasOwn(options, definition.key)) {
        throw new UserError(`Option may be used only once: ${name}`);
      }
      if (!definition.value) {
        if (inlineValue !== undefined) {
          throw new UserError(`Option does not take a value: ${name}`);
        }
        options[definition.key] = true;
        continue;
      }

      const value = inlineValue ?? tokens[++index];
      if (value === undefined || (inlineValue === undefined && value.startsWith("--"))) {
        throw new UserError(`Missing value for option: ${name}`);
      }
      options[definition.key] = value;
      continue;
    }
    positionals.push(token);
  }

  return { options, positionals };
}

export function parseCliArgs(argv) {
  const [command, ...tokens] = argv;
  if (!command || command === "help" || command === "--help" || command === "-h") {
    return { command: "help" };
  }
  if (!Object.hasOwn(optionDefinitions, command)) {
    throw new UserError(`Unknown command: ${command}\n\n${USAGE}`);
  }
  if (tokens.includes("--help") || tokens.includes("-h")) {
    return { command: "help" };
  }

  const { options, positionals } = parseOptions(tokens, optionDefinitions[command]);
  if (command === "search") {
    if (positionals.length !== 1 || !positionals[0].trim()) {
      throw new UserError("search requires exactly one non-empty query.");
    }
    const locale = options.locale ?? "zh";
    if (locale !== "zh" && locale !== "en") {
      throw new UserError("--locale must be zh or en.");
    }
    const limit = options.limit === undefined ? 8 : Number(options.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
      throw new UserError("--limit must be an integer from 1 to 20.");
    }
    return {
      command,
      query: positionals[0].trim(),
      locale,
      limit,
      json: options.json ?? false,
      noCache: options.noCache ?? false,
    };
  }

  if (command === "publish") {
    if (positionals.length !== 1) {
      throw new UserError("publish requires exactly one Markdown file.");
    }
    return {
      command,
      file: positionals[0],
      title: options.title,
      description: options.description,
      tags: options.tags === undefined ? undefined : options.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      slug: options.slug,
      dryRun: options.dryRun ?? false,
    };
  }

  if (positionals.length > 0 || Object.keys(options).length > 0) {
    throw new UserError("whoami does not accept arguments.");
  }
  return { command };
}
