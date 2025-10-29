import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { getServer } from "#/mcp/server"

export default defineEventHandler(async (event) => {
  const req = event.node.req
  const res = event.node.res
  const server = getServer()
  try {
    // 一些客户端（或直接 curl）不会同时发送 "application/json" 与 "text/event-stream"
    // 的 Accept 头，SDK 会返回 406。为提升兼容性，这里在缺省时补全。
    const accept = req.headers["accept"] || req.headers["Accept"]
    if (typeof accept !== "string" || !(/application\/json/i.test(accept) && /text\/event-stream/i.test(accept))) {
      req.headers["accept"] = "application/json, text/event-stream"
    }

    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    transport.onerror = console.error.bind(console)
    await server.connect(transport)
    await transport.handleRequest(req, res, await readBody(event))
    res.on("close", () => {
      // console.log("Request closed")
      transport.close()
      server.close()
    })
    return res
  } catch (e) {
    console.error(e)
    return {
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: "Internal server error",
      },
      id: null,
    }
  }
})
