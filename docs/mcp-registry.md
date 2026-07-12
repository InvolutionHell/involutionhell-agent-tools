# MCP Registry 登记 Runbook

把 InvolutionHell MCP server 登记到官方 MCP Registry（registry.modelcontextprotocol.io），
自动进入 GitHub MCP Registry（github.com/mcp）获得曝光。

## 前置条件

1. 主仓库 PR #365 已合并，`https://involutionhell.com/api/mcp` 在生产环境可用
   （验证：`curl -X POST https://involutionhell.com/api/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"1.0.0"}}}'`）
2. 发布到 `io.github.involutionhell/*` 命名空间需要用 InvolutionHell org 成员的 GitHub 身份授权（Colin 有权限）。
3. Registry 目前仍是 preview 阶段，schema 可能变动——以 `mcp-publisher init` 生成的骨架为准，`server.json` 模板仅供参考。

## 步骤

```bash
brew install mcp-publisher   # 或参考官方安装方式

cd <本仓库>/docs/registry
mcp-publisher init           # 生成/校验 server.json 骨架，按模板内容填充
mcp-publisher login github   # 跳浏览器 GitHub 授权（org 身份）
mcp-publisher publish
```

发布后在 https://registry.modelcontextprotocol.io 搜索 `involutionhell` 验证条目。

## 版本更新

server 有行为变更（工具增删、schema 变化）时，更新 `server.json` 的 `version` 并重新 `mcp-publisher publish`。
