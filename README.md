# involutionhell-agent-tools

这是一个小型独立仓库，包含两部分：

- 根目录的 `SKILL.md`：教 AI agent 搜索、查重、发布 InvolutionHell 社区文章，并在适合时通过 GitHub PR 进入知识库。
- `involutionhell` / `ih` Node CLI：在没有 MCP 连接时，提供 shell 侧的搜索和轻量发布能力。

Node.js 要求 `>= 20`。CLI 直接读取公开静态 Orama 索引；发布调用 InvolutionHell 后端 API。

## 安装与使用

包发布后可直接通过 npx 使用：

```bash
npx --yes involutionhell-cli search "数组" --limit 3
npx --yes involutionhell-cli publish post.md --dry-run
```

从本仓库运行：

```bash
npm install
npm exec -- involutionhell search "数组" --limit 3
node bin/involutionhell.mjs search "数组" --limit 3
```

安装 Agent Skill：

```bash
npx skills add InvolutionHell/involutionhell-agent-tools
```

也可手动将 `SKILL.md` 复制到 agent 的技能目录，例如：

```text
~/.agents/skills/involutionhell/SKILL.md
```

## CLI 参考

### 搜索

```bash
involutionhell search "query" [--locale zh|en] [--limit N] [--json] [--no-cache]
```

- 默认语言为 `zh`，默认返回 8 个页面，`--limit` 范围为 1–20。
- 结果按页面聚合，包含标题、绝对 URL、description 和相关片段。
- 索引缓存 1 小时。默认路径是 `~/.cache/involutionhell/search.<locale>.json`；设置 `XDG_CACHE_HOME` 时使用 `$XDG_CACHE_HOME/involutionhell/`。
- `--no-cache` 强制重新下载并更新缓存。

### 发布轻量帖子

```bash
involutionhell publish post.md \
  [--title "Title"] \
  [--description "Summary"] \
  [--tags career,learn] \
  [--slug custom-slug] \
  [--dry-run]
```

Markdown 可以包含 YAML frontmatter：

```markdown
---
title: 动态数组笔记
description: 一篇介绍动态数组扩容策略、复杂度与工程权衡的简短笔记。
tags: [learn, cs]
slug: dynamic-array-notes
---

# 正文
```

命令行参数优先于 frontmatter。`--dry-run` 打印将要发送的 JSON payload，不访问网络，也不打印 token。

真实发布和 `whoami` 只从环境变量读取凭证：

```bash
export INVOLUTIONHELL_SATOKEN="..."
involutionhell whoami
involutionhell publish post.md
```

登录 [involutionhell.com](https://involutionhell.com) 后复制 satoken。不要把 token 放进 CLI 参数，因为参数可能进入 shell history 或进程列表。

### 环境覆盖

```text
INVOLUTIONHELL_SITE_URL  默认 https://involutionhell.com
INVOLUTIONHELL_API_URL   默认 https://api.involutionhell.com
```

这些覆盖项用于本地或测试环境。

## 与 MCP server 的关系

主站的 `https://involutionhell.com/api/mcp` 是首选集成，暴露匿名 `search` 和鉴权 `publish` 工具。Agent 已连接名为 `involutionhell` 的 MCP server 时，应直接使用 MCP；本 CLI 是没有 MCP 连接时的轻量 shell fallback。两者共享搜索语义和发布 API，但本仓库不复制 MCP server。

## 开发

```bash
npm install
npm test
npm run smoke
```

也可以使用 pnpm：

```bash
pnpm install
pnpm test
pnpm smoke
```

单元测试不会访问网络；`smoke` 会对生产站点执行一次只读中文搜索。发布流程的端到端检查应始终使用 `--dry-run`，不要对生产发布接口做测试调用。

## License

MIT
