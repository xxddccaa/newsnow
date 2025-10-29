import { z } from "zod"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js"
import packageJSON from "../../package.json"
import { description, ids } from "./desc.js"

export function getServer() {
  const server = new McpServer(
    {
      name: "NewsNow",
      version: packageJSON.version,
    },
    { capabilities: {} },
  )

  server.tool(
    "get_hotest_latest_news",
    `get hotest or latest news from source by {id}, return {count: 10} news.`,
    {
      id: (z.enum as any)(ids as [string, ...string[]]).describe(
        `source id. Allowed values: ${ids.join(", ")}. For readability: ${description}`,
      ),
      count: z
        .number()
        .int()
        .min(1)
        .max(30)
        .default(10)
        .describe("count of news to return, 1-30, default 10."),
    },
    async ({ id, count }): Promise<CallToolResult> => {
      let n = Number(count)
      if (Number.isNaN(n) || n < 1) n = 10
      if (n > 30) n = 30

      const res: SourceResponse = await $fetch(`/api/s?id=${id}`)
      return {
        content: res.items.slice(0, n).map((item) => {
          return {
            text: `[${item.title}](${item.url})`,
            type: "text",
          }
        }),
      }
    },
  )

  server.server.onerror = console.error.bind(console)

  return server
}
