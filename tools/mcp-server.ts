#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import { description } from "../server/mcp/desc.js"
import packageJSON from "../package.json"

const BASE_URL = process.env.BASE_URL || "http://localhost:4444"

const server = new McpServer(
  {
    name: "NewsNow",
    version: packageJSON.version,
  },
  { capabilities: { logging: {} } },
)

server.tool(
  "get_hotest_latest_news",
  `get hotest or latest news from source by {id}, return {count: 10} news.`,
  {
    id: z.string().describe(`source id. e.g. ${description}`),
    count: z.any().default(10).describe("count of news to return."),
  },
  async ({ id, count }): Promise<CallToolResult> => {
    let n = Number(count)
    if (Number.isNaN(n) || n < 1) {
      n = 10
    }

    try {
      const response = await fetch(`${BASE_URL}/api/s?id=${id}`)
      const res = await response.json()
      
      if (!res.items) {
        return {
          content: [{
            type: "text",
            text: `Error: No items found for source ${id}`,
          }],
        }
      }

      return {
        content: res.items.slice(0, n).map((item: any) => {
          return {
            text: `[${item.title}](${item.url})`,
            type: "text",
          }
        }),
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error fetching news: ${error instanceof Error ? error.message : String(error)}`,
        }],
      }
    }
  },
)

server.server.onerror = console.error.bind(console)

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error(`NewsNow MCP Server running on stdio`)
  console.error(`BASE_URL: ${BASE_URL}`)
}

main().catch(console.error)

