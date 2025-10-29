# 使用本地 MCP Server 连接到你的服务器

## 问题说明

### 当前配置的问题

```json
"newsnow": {
  "command": "npx",
  "args": ["-y", "newsnow-mcp-server"],
  "env": { "BASE_URL": "http://101.126.150.28:9044" }
}
```

**这个配置使用的是 npm 官方发布的 `newsnow-mcp-server` 包**，它：
- ❌ 不包含你刚添加的小红书配置
- ❌ 使用的是打包时的 `sources.json`（静态的）
- ❌ 不会随着你的服务器更新而更新

### 解决方案

使用**本地的 MCP server**，它会实时从你的服务器读取最新配置。

---

## Windows 配置方法

### 方法一：使用项目路径（推荐）

在 MCP 配置中（Claude Desktop 或 Inspector）：

```json
{
  "mcpServers": {
    "newsnow": {
      "command": "pnpm",
      "args": ["run", "mcp"],
      "cwd": "D:\\path\\to\\newsnow",
      "env": {
        "BASE_URL": "http://101.126.150.28:9044"
      }
    }
  }
}
```

**注意**：
- 将 `D:\\path\\to\\newsnow` 改为你的项目实际路径
- Windows 路径要用双反斜杠 `\\` 或单正斜杠 `/`

### 方法二：使用批处理文件

1. 项目根目录已经有 `mcp-server.bat` 文件
2. MCP 配置：

```json
{
  "mcpServers": {
    "newsnow": {
      "command": "D:\\path\\to\\newsnow\\mcp-server.bat"
    }
  }
}
```

### 方法三：使用 node 直接运行

```json
{
  "mcpServers": {
    "newsnow": {
      "command": "node",
      "args": [
        "--import", "tsx/esm",
        "D:\\path\\to\\newsnow\\tools\\mcp-server.ts"
      ],
      "env": {
        "BASE_URL": "http://101.126.150.28:9044"
      }
    }
  }
}
```

---

## Linux/Mac 配置方法

```json
{
  "mcpServers": {
    "newsnow": {
      "command": "pnpm",
      "args": ["run", "mcp"],
      "cwd": "/home/xd/newsnow",
      "env": {
        "BASE_URL": "http://101.126.150.28:9044"
      }
    }
  }
}
```

---

## 验证配置

### 1. 测试本地 MCP Server

在项目目录下运行：
```bash
# Linux/Mac
cd /home/xd/newsnow
BASE_URL=http://101.126.150.28:9044 pnpm run mcp

# Windows
cd D:\path\to\newsnow
set BASE_URL=http://101.126.150.28:9044
pnpm run mcp
```

应该看到：
```
NewsNow MCP Server running on stdio
BASE_URL: http://101.126.150.28:9044
```

### 2. 使用 MCP Inspector 测试

```bash
# Windows
npx @modelcontextprotocol/inspector
```

在 Inspector 中输入你的配置，然后查看 `get_hotest_latest_news` 工具的描述，应该能看到小红书。

### 3. 检查工具描述

工具 `id` 参数的描述中应该包含：
```
...;小红书-热点榜单 id is xiaohongshu;...
```

---

## 工作原理对比

### 旧方式（npm 包）
```
MCP Client → npx newsnow-mcp-server (npm包，静态sources.json) → 你的服务器
```
- npm 包中的 sources.json 是发布时的版本
- 不包含你新添加的数据源

### 新方式（本地）
```
MCP Client → 本地 mcp-server.ts (动态读取) → 你的服务器
```
- 使用项目中最新的 sources.json
- 包含所有你添加的数据源（包括小红书）

---

## 测试小红书数据源

### 通过 MCP
```
工具: get_hotest_latest_news
参数:
  id: xiaohongshu
  count: 10
```

### 直接 API 测试
```bash
curl 'http://101.126.150.28:9044/api/s?id=xiaohongshu'
```

---

## 常见问题

### Q: 为什么要用本地的而不是 npm 包？
A: npm 包是官方发布的，不会包含你自己添加的数据源。本地版本会实时同步你的服务器配置。

### Q: 如果更新了数据源，需要重启吗？
A: 需要重启 MCP server（Claude Desktop 或 Inspector），因为工具描述是启动时生成的。但数据本身是实时从服务器获取的。

### Q: 可以用在 Claude Desktop 吗？
A: 可以！配置方法相同。配置文件位置：
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

### Q: BASE_URL 必须是公网地址吗？
A: 不是，只要你运行 MCP server 的机器能访问到就行。本地可以用 `http://localhost:4444`。

---

## 数据源 ID 完整列表

运行本地 MCP server 后，工具描述会包含所有可用的数据源 ID，包括：

- `xiaohongshu` - 小红书热点榜单 ✨ 新增
- `weibo` - 微博实时热搜
- `zhihu` - 知乎热榜
- `douyin` - 抖音热搜
- ... 等等

完整列表会显示在 `get_hotest_latest_news` 工具的 `id` 参数描述中。

