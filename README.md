# veyra-contacts

A contact manager MCP tool for AI agents. Store and query names, emails, phone numbers, and companies. Contact data is business-critical — **all write operations are Class B** and require [Veyra](https://veyra.to) commit mode authorization.

## Overview

`veyra-contacts` gives AI agents a persistent contact database backed by SQLite. Reads are free. All mutations (create, update, delete) are Class B (€0.02) because contact data is business-critical and must be protected against accidental writes.

## Installation

```bash
npm install
npm run build
```

Data is stored at `~/.veyra-contacts/data.db`, created automatically on first run.

## MCP Configuration (Claude Desktop)

```json
{
  "mcpServers": {
    "veyra-contacts": {
      "command": "node",
      "args": ["/absolute/path/to/veyra-contacts/dist/index.js"]
    }
  }
}
```

## Tools

| Tool | Input | Class | Price |
|------|-------|-------|-------|
| `list_contacts` | `{ tag?, company? }` | — | FREE |
| `get_contact` | `{ id }` | — | FREE |
| `search_contacts` | `{ query }` | — | FREE |
| `create_contact` | `{ name, email?, phone?, company?, tags?, veyra_token? }` | B | €0.02 |
| `update_contact` | `{ id, name?, email?, veyra_token? }` | B | €0.02 |
| `delete_contact` | `{ id, veyra_token? }` | B | €0.02 |

> All writes are Class B because contact data is business-critical.

## Examples

### Read (no token needed)

```json
// List all contacts
{ "tool": "list_contacts", "arguments": {} }

// Filter by company
{ "tool": "list_contacts", "arguments": { "company": "Acme Corp" } }

// Search across name, email, company, tags
{ "tool": "search_contacts", "arguments": { "query": "alice" } }

// Get a specific contact
{ "tool": "get_contact", "arguments": { "id": "1712345678-abc1234" } }
```

### Write (Veyra token required — Class B)

```json
// Create a contact
{
  "tool": "create_contact",
  "arguments": {
    "name": "Alice Müller",
    "email": "alice@example.com",
    "phone": "+49 123 456789",
    "company": "Acme Corp",
    "tags": "customer,vip",
    "veyra_token": "vt_..."
  }
}

// Update a contact
{
  "tool": "update_contact",
  "arguments": {
    "id": "1712345678-abc1234",
    "email": "alice.new@example.com",
    "veyra_token": "vt_..."
  }
}

// Delete a contact
{
  "tool": "delete_contact",
  "arguments": { "id": "1712345678-abc1234", "veyra_token": "vt_..." }
}
```

### Error response when token is missing

```json
{
  "error": "VeyraCommitRequired",
  "message": "Write operations require Veyra commit mode.",
  "currentMode": "open",
  "requiredMode": "commit",
  "authorize_endpoint": "https://api.veyra.to/v1/authorize-action",
  "docs_url": "https://veyra.to"
}
```

## How Veyra Works

Veyra is a commit-mode authorization layer for AI agents. When an agent attempts a write:

1. The agent calls the tool without `veyra_token` → receives `VeyraCommitRequired` with `authorize_endpoint`.
2. The agent/user calls the authorize endpoint to obtain a token.
3. The agent retries with `veyra_token` set.
4. `veyra-contacts` verifies the token via `@veyrahq/sdk-node` before executing the action.

See [veyra.to](https://veyra.to) for full documentation.

## License

MIT

## Hosted Pack (recommended)

Prefer the hosted pack for one-URL integration:

```json
{
  "mcpServers": {
    "veyra": {
      "url": "https://mcp.veyra.to/sse"
    }
  }
}
```

One URL. 48 tools. 24 free reads. 24 protected writes.

Hosted pack:
https://mcp.veyra.to/sse

Pack manifest:
https://mcp.veyra.to/.well-known/veyra-pack.json

Use the hosted pack when you want the fastest MCP integration path across all Veyra tool families.
Use this standalone package when you specifically want this tool on its own.

## Part of the Veyra Ecosystem

Veyra is commit mode for production AI agent actions.
All tools: reads free, writes require Veyra commit mode.

| Tool | Description | Install |
|------|-------------|---------|
| [veyra-memory](https://github.com/Aquariosan/veyra-memory) | Key-value memory store | `npm i -g veyra-memory` |
| [veyra-notes](https://github.com/Aquariosan/veyra-notes) | Note-taking with tags | `npm i -g veyra-notes` |
| [veyra-tasks](https://github.com/Aquariosan/veyra-tasks) | Task management | `npm i -g veyra-tasks` |
| [veyra-snippets](https://github.com/Aquariosan/veyra-snippets) | Code snippet storage | `npm i -g veyra-snippets` |
| [veyra-bookmarks](https://github.com/Aquariosan/veyra-bookmarks) | Bookmark manager | `npm i -g veyra-bookmarks` |
| [veyra-forms](https://github.com/Aquariosan/veyra-forms) | Form builder | `npm i -g veyra-forms` |
| [veyra-webhooks](https://github.com/Aquariosan/veyra-webhooks) | Webhook sender | `npm i -g veyra-webhooks` |

**SDK:** [npm install @veyrahq/sdk-node](https://www.npmjs.com/package/@veyrahq/sdk-node)
**Website:** [veyra.to](https://veyra.to)
