# NewsNow MCP 使用指南

本文档说明如何在 Cursor、Claude Desktop 和 MCP Inspector 中使用 NewsNow MCP 服务。

---

## 目录

- [服务架构说明](#服务架构说明)
- [在 Cursor 中使用](#在-cursor-中使用)
- [在 Claude Desktop 中使用](#在-claude-desktop-中使用)
- [在 MCP Inspector 中调试](#在-mcp-inspector-中调试)
- [验证服务是否正常](#验证服务是否正常)
- [常见问题](#常见问题)

---

## 服务架构说明

NewsNow 提供了**两种** MCP 接入方式：

### 方式一：HTTP MCP 服务（推荐用于远程服务器）

通过 Docker 部署的 Web 服务直接暴露 MCP 端点：
- **端点**: `http://your-server:9044/api/mcp`
- **传输协议**: 
  - `POST /api/mcp` - HTTP (JSON-RPC) 同步请求/响应
  - `GET /api/mcp` - Streamable HTTP (SSE) 流式传输
- **适用场景**: Cursor、Claude Desktop（通过 HTTP 连接远程服务）
- **优点**: 无需本地安装依赖，多客户端共享同一服务

### 方式二：本地 STDIO 代理（推荐用于开发调试）

通过本地运行的代理脚本连接到远程服务器：
- **命令**: `pnpm run mcp` (执行 `tools/mcp-server.ts`)
- **传输协议**: STDIO (标准输入/输出)
- **适用场景**: 本地开发、MCP Inspector 调试
- **优点**: 符合 MCP 标准实践，便于本地断点调试

---

## 在 Cursor 中使用

Cursor 目前**仅支持 HTTP (JSON-RPC)** 传输方式，不支持 Streamable HTTP。

### 配置步骤

1. 打开 Cursor 设置 → MCP 配置文件
   - Mac: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
   - Windows: `%APPDATA%\Cursor\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
   - Linux: `~/.config/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

2. 添加以下配置：

```json
{
  "mcpServers": {
    "newsnow": {
      "type": "http",
      "url": "http://107.173.199.53:9044/api/mcp"
    }
  }
}
```

**参数说明**：
- `type`: 固定填 `"http"`（Cursor 不支持 `streamable-http`）
- `url`: 替换为你的服务器地址

3. 重启 Cursor

4. 在对话中调用工具：
```
请帮我获取知乎热榜前 10 条新闻
```

Cursor 会自动调用 `get_hotest_latest_news` 工具。

---

## 在 Claude Desktop 中使用

Claude Desktop 支持多种传输方式，推荐使用 **HTTP** 方式连接远程服务。

### 方式一：HTTP 连接（推荐）

1. 打开配置文件：
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. 添加配置：

```json
{
  "mcpServers": {
    "newsnow": {
      "type": "http",
      "url": "http://107.173.199.53:9044/api/mcp"
    }
  }
}
```

3. 重启 Claude Desktop

### 方式二：本地 STDIO 代理（适合开发）

如果你需要调试或本地运行，可以使用 STDIO 方式：

```json
{
  "mcpServers": {
    "newsnow": {
      "command": "pnpm",
      "args": ["run", "mcp"],
      "cwd": "/root/newsnow",
      "env": {
        "BASE_URL": "http://107.173.199.53:9044"
      }
    }
  }
}
```

**注意**：
- `cwd` 必须指向项目根目录的**绝对路径**
- Windows 路径使用双反斜杠：`"cwd": "C:\\Users\\YourName\\newsnow"`
- `BASE_URL` 指向你的 NewsNow 服务器地址

---

## 在 MCP Inspector 中调试

MCP Inspector 是官方调试工具，支持所有传输方式。

### 方式一：Streamable HTTP（推荐，测试流式功能）

1. 启动 Inspector：
```bash
npx @modelcontextprotocol/inspector@latest
```

2. 在连接界面配置：
   - **Transport Type**: 选择 `Streamable HTTP`
   - **URL**: `http://107.173.199.53:9044/api/mcp`
   - 其他选项保持默认

3. 点击 **Connect**

4. 测试工具调用：
   - 工具名称: `get_hotest_latest_news`
   - 参数:
     ```json
     {
       "id": "zhihu",
       "count": 10
     }
     ```

### 方式二：HTTP (JSON-RPC)

如果 Streamable HTTP 连接有问题，可以降级使用 HTTP：

1. 启动 Inspector
2. 配置：
   - **Transport Type**: 选择 `HTTP`
   - **URL**: `http://107.173.199.53:9044/api/mcp`
3. 点击 **Connect**

### 方式三：STDIO（本地调试，最稳定）

适合开发时本地断点调试：

1. 启动 Inspector：
```bash
cd /root/newsnow
npx @modelcontextprotocol/inspector pnpm run mcp
```

2. Inspector 会自动连接本地 STDIO 服务

3. 设置环境变量（可选）：
```bash
BASE_URL=http://107.173.199.53:9044 npx @modelcontextprotocol/inspector pnpm run mcp
```

---

## 验证服务是否正常

### 1. 检查 Docker 服务状态

```bash
docker compose -f docker-compose.local.yml ps
```

应该看到 `newsnow` 服务状态为 `Up`。

### 2. 测试 HTTP 端点

测试同步 JSON-RPC（POST）：
```bash
curl -s 'http://107.173.199.53:9044/api/mcp' \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

应该返回包含 `"result"` 的 JSON 响应。

测试 SSE 流式端点（GET）：
```bash
curl -N 'http://107.173.199.53:9044/api/mcp'
```

连接应该保持打开状态（可能不会立即输出，这是正常的）。

### 3. 测试数据接口

```bash
curl 'http://107.173.199.53:9044/api/s?id=zhihu'
```

应该返回知乎热榜数据。

### 4. 重启服务

修改代码后需要重新构建：
```bash
docker compose -f docker-compose.local.yml up -d --build
```

---

## 常见问题

### Q1: Cursor 中无法连接 MCP 服务

**A**: 检查以下几点：
1. 确认 `type` 是 `"http"` 而不是 `"streamable-http"`
2. 确认 URL 中的 IP 和端口正确
3. 确认服务器防火墙已开放 9044 端口
4. 重启 Cursor

### Q2: Inspector 报错 "Connection Error"

**A**: 可能原因：
1. 服务未启动：运行 `docker compose -f docker-compose.local.yml up -d`
2. 端口未开放：检查防火墙规则
3. URL 填写错误：确认是 `/api/mcp` 而不是 `/api/mcp/`
4. 传输类型不匹配：尝试切换到 HTTP 或 STDIO

### Q3: 为什么不推荐使用 `npx newsnow-mcp-server`？

**A**: 因为：
- `newsnow-mcp-server` 是 npm 官方发布的包，代码是打包时的快照
- 你修改了本地服务器代码，但没有发布新版本到 npm
- 官方包的 `sources.json` 是静态的，不会包含你新添加的数据源
- 使用本地 `tools/mcp-server.ts` 可以实时反映你的代码修改

### Q4: HTTP 和 Streamable HTTP 有什么区别？

**A**:
- **HTTP (JSON-RPC)**: 同步请求/响应，每次调用等待完整结果返回
- **Streamable HTTP (SSE)**: 基于 Server-Sent Events，支持流式返回、实时推送、长连接
- Cursor 目前仅支持 HTTP，Inspector 和 Claude Desktop 都支持

### Q5: 可以同时在多个客户端使用同一个 MCP 服务吗？

**A**: 可以！这正是 HTTP MCP 的优势：
- 多个 Cursor 实例可以同时连接
- Cursor 和 Claude Desktop 可以共用同一个服务
- 每个连接都是独立的会话

### Q6: 本地开发时如何快速测试？

**A**: 推荐使用 STDIO 方式：
```bash
cd /root/newsnow
BASE_URL=http://localhost:4444 pnpm run mcp
```

然后在另一个终端启动 Inspector：
```bash
npx @modelcontextprotocol/inspector pnpm run mcp
```

这样可以直接在本地调试，无需 Docker。

### Q7: 如何查看 MCP 服务日志？

**A**:
```bash
# 查看 Docker 日志
docker compose -f docker-compose.local.yml logs -f newsnow

# 如果使用 STDIO 方式，日志会直接输出到终端
```

---

## 可用的数据源 ID

调用 `get_hotest_latest_news` 工具时，`id` 参数支持以下值：

- `zhihu` - 知乎热榜
- `weibo` - 微博热搜
- `douyin` - 抖音热点
- `toutiao` - 今日头条
- `baidu` - 百度热搜
- `bilibili` - 哔哩哔哩热门
- `xiaohongshu` - 小红书热榜
- `36kr` - 36氪
- `github` - GitHub Trending
- `hackernews` - Hacker News
- `v2ex` - V2EX 最热
- `juejin` - 稀土掘金
- `sspai` - 少数派
- `producthunt` - Product Hunt
- ...等等

完整列表可以通过工具描述查看，或访问 `http://107.173.199.53:9044/` 查看前端页面。

---

## 总结

| 使用场景 | 推荐方式 | 传输协议 | 配置复杂度 |
|---------|---------|---------|----------|
| Cursor 日常使用 | HTTP | JSON-RPC | ⭐ 简单 |
| Claude Desktop | HTTP | JSON-RPC | ⭐ 简单 |
| Inspector 调试 | Streamable HTTP | SSE | ⭐⭐ 中等 |
| 本地开发调试 | STDIO | 标准输入输出 | ⭐⭐⭐ 需要项目环境 |

**推荐配置**：
- 生产环境：使用 HTTP 方式，稳定可靠
- 开发调试：使用 STDIO + Inspector，便于排查问题

---

## 技术支持

如有问题，请检查：
1. Docker 服务是否正常运行
2. 防火墙是否开放 9044 端口
3. 配置文件中的 URL 是否正确
4. 服务器日志是否有报错信息

项目地址: https://github.com/ourongxing/newsnow

