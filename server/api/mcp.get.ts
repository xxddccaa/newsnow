import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { getServer } from "#/mcp/server"

export default defineEventHandler(async (event) => {
  const req = event.node.req
  const res = event.node.res
  const server = getServer()
  try {
    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    transport.onerror = console.error.bind(console)
    await server.connect(transport)
    await transport.handleRequest(req, res)
    res.on("close", () => {
      transport.close()
      server.close()
    })
    return res
  } catch (e) {
    console.error(e)
    res.statusCode = 500
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32603, message: "Internal server error" },
      id: null,
    }))
  }
})



