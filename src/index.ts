#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as store from "./store.js";
import { requireVeyra } from "./veyra.js";

const server = new Server(
  { name: "veyra-contacts", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_contacts",
      description: "List contacts, optionally filtered by tag or company. FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          tag: { type: "string", description: "Filter by tag" },
          company: { type: "string", description: "Filter by company name" },
        },
      },
    },
    {
      name: "get_contact",
      description: "Retrieve a contact by ID. FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The contact ID" },
        },
        required: ["id"],
      },
    },
    {
      name: "search_contacts",
      description: "Search contacts by query (matches name, email, company, tags). FREE — no token required.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term" },
        },
        required: ["query"],
      },
    },
    {
      name: "create_contact",
      description:
        "Create a new contact. Business-critical — requires Veyra commit mode (Class B — €0.02).",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name" },
          email: { type: "string", description: "Email address" },
          phone: { type: "string", description: "Phone number" },
          company: { type: "string", description: "Company name" },
          tags: { type: "string", description: "Optional comma-separated tags" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["name"],
      },
    },
    {
      name: "update_contact",
      description:
        "Update a contact's name or email. Business-critical — requires Veyra commit mode (Class B — €0.02).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The contact ID to update" },
          name: { type: "string", description: "New name" },
          email: { type: "string", description: "New email address" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["id"],
      },
    },
    {
      name: "delete_contact",
      description:
        "Delete a contact. Business-critical — requires Veyra commit mode (Class B — €0.02).",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "The contact ID to delete" },
          veyra_token: { type: "string", description: "Veyra authorization token" },
        },
        required: ["id"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_contacts": {
      const { tag, company } = args as { tag?: string; company?: string };
      const contacts = store.list({ tag, company });
      return {
        content: [{ type: "text", text: JSON.stringify({ count: contacts.length, contacts }) }],
      };
    }

    case "get_contact": {
      const { id } = args as { id: string };
      const contact = store.get(id);
      if (!contact) {
        return { content: [{ type: "text", text: JSON.stringify({ found: false, id }) }] };
      }
      return { content: [{ type: "text", text: JSON.stringify({ found: true, ...contact }) }] };
    }

    case "search_contacts": {
      const { query } = args as { query: string };
      const contacts = store.search(query);
      return {
        content: [{ type: "text", text: JSON.stringify({ count: contacts.length, query, contacts }) }],
      };
    }

    case "create_contact": {
      const { name: cName, email, phone, company, tags, veyra_token } = args as {
        name: string;
        email?: string;
        phone?: string;
        company?: string;
        tags?: string;
        veyra_token?: string;
      };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const contact = store.create({ name: cName, email, phone, company, tags });
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, commit_mode: "verified", ...contact }) }],
      };
    }

    case "update_contact": {
      const { id, name, email, veyra_token } = args as {
        id: string;
        name?: string;
        email?: string;
        veyra_token?: string;
      };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const contact = store.update(id, { name, email });
      if (!contact) {
        return { content: [{ type: "text", text: JSON.stringify({ success: false, error: "ContactNotFound", id }) }] };
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, commit_mode: "verified", ...contact }) }],
      };
    }

    case "delete_contact": {
      const { id, veyra_token } = args as { id: string; veyra_token?: string };
      const check = await requireVeyra(veyra_token);
      if (!check.ok) {
        return { content: [{ type: "text", text: JSON.stringify(check.error, null, 2) }] };
      }
      const deleted = store.del(id);
      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, id, deleted, commit_mode: "verified" }) }],
      };
    }

    default:
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "UnknownTool", tool: name }) }],
      };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("veyra-contacts server error:", err);
  process.exit(1);
});
