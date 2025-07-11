# mcp-server (TypeScript Edition)

MCP server following Claude Desktop best practices.

## Installation

```bash
npm install
npm run build
```

## Configuration

### Claude Desktop Setup

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "mcp-server": {
      "command": "node",
      "args": [
        "/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/mcp-server/dist/index.js"
      ],
      "env": {
        "MCP_DEBUG": "true",
        "MCP_LOG_FILE": "/Users/tbwa/Documents/GitHub/retail-insights-dashboard-ph/mcp-server/debug.log"
      }
    }
  }
}
```

## Development

```bash
npm run dev   # Development mode with hot reload
npm test      # Run tests
npm run build # Build for production
```

## Migration Notes

This project has been migrated to TypeScript following MCP best practices:

- No console output (uses file-based logging)
- TypeScript for type safety
- Zod validation for inputs
- Graceful shutdown handling
- Proper error handling with MCP error codes
