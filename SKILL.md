---
name: involutionhell
description: 搜索、阅读并发布 InvolutionHell 社区文章。只要用户想在 InvolutionHell 查找资料、阅读已有文章、检查重复主题、发布轻量帖子，或把内容通过 GitHub PR 收录进知识库，就使用此技能。
---

# InvolutionHell

## 决策树

1. 若已连接名为 `involutionhell` 的 MCP server，直接使用它的 `search` / `publish` 工具。搜索无需鉴权；发布使用 MCP 连接的 `Authorization: Bearer <satoken>`。
2. 否则，若有 shell，优先使用 CLI：

```bash
npx --yes github:InvolutionHell/involutionhell-agent-tools search "query" --locale zh --limit 8
npx --yes github:InvolutionHell/involutionhell-agent-tools publish post.md --dry-run
```

   本地检出本仓库并安装依赖后，也可运行 `involutionhell`、`ih` 或 `node bin/involutionhell.mjs`。无法使用 CLI 时，才采用下文的 `curl`。
3. 若既无 MCP 又无 shell，告知用户添加 MCP connector：`https://involutionhell.com/api/mcp`。OAuth 上线前，web client 仅搜索，不发布。

## 必做：发布前查重

发布任何内容前，始终先用相同主题、中英文关键词和可能的同义词搜索已有文章。向用户简要列出：

- 最相关的现有文章及链接；
- 新稿与现有内容的重叠点和新增价值；
- 建议合并、补充还是另发。

让用户决定后再发布，不得跳过查重直接发布。

## 搜索与轻量发布

```bash
involutionhell search "dynamic array" --locale en --limit 5 --json
involutionhell publish post.md --title "A useful title" --tags learn,cs
involutionhell whoami
```

轻量帖使用 Markdown 正文。标题要准确且有信息量；推荐提供 description。若文章以后可能进入知识库，description 至少写 60 个字符。标签保持少而准，优先沿用 `career`、`learn`、`ai`、`cs`、`projects` 等现有分类。CLI 会读取 YAML frontmatter，命令行参数优先覆盖 `title`、`description`、`tags`、`slug`。

发布凭证只能放在 `INVOLUTIONHELL_SATOKEN`，不要写入命令参数、文档或日志。登录 `https://involutionhell.com` 后复制 satoken：

```bash
read -s INVOLUTIONHELL_SATOKEN
export INVOLUTIONHELL_SATOKEN
involutionhell whoami
```

satoken 有效期为 30 天；失效后重新登录并更新。MCP 发布则在可信本地客户端配置 `Authorization: Bearer <satoken>`。无 OAuth 的 web client 目前只做匿名搜索。

CLI 不可用时可直接调用后端：

```bash
curl -fsS "${INVOLUTIONHELL_API_URL:-https://api.involutionhell.com}/auth/me" \
  -H "satoken: $INVOLUTIONHELL_SATOKEN"

curl -fsS "${INVOLUTIONHELL_API_URL:-https://api.involutionhell.com}/api/posts" \
  -H "content-type: application/json" \
  -H "satoken: $INVOLUTIONHELL_SATOKEN" \
  --data-binary @payload.json
```

默认 `INVOLUTIONHELL_API_URL=https://api.involutionhell.com`。搜索仍应优先用 CLI 或 MCP，因为公开的 `/search.zh.json` 与 `/search.en.json` 是需要 Orama 恢复的持久化索引，并非普通搜索结果。

## 进知识库（仅 shell agent）

知识库位于 `github.com/InvolutionHell/involutionhell`，通过 GitHub PR 发布：

1. Fork 仓库，从最新主分支创建 `feat/<user>/<slug>`。
2. 把文件放到 `content/docs/<section>/<kebab-slug>.mdx`。
3. 写必需 frontmatter：`title`、至少 60 字符的 `description`、`date`、`tags`。
4. 图片放在同级 `<kebab-slug>.assets/` 目录并使用相对路径。
5. 不要手写 `docId`；CI 会生成。英文翻译使用 `.en.mdx` 后缀。
6. 检查改动后创建 PR：

```bash
git switch -c feat/<user>/<slug>
git add content/docs/<section>/<kebab-slug>.mdx
git commit -m "docs: add <slug>"
git push -u origin feat/<user>/<slug>
gh pr create --repo InvolutionHell/involutionhell
```

PR 必须通过 frontmatter 与 description 长度的 CI 检查。创建 PR 前仍需完成查重并取得用户确认。
