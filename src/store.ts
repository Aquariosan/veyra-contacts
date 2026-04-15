import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const DB_DIR = join(homedir(), ".veyra-contacts");
const DB_PATH = join(DB_DIR, "data.db");

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id         TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT,
    phone      TEXT,
    company    TEXT,
    tags       TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function list(filters: { tag?: string; company?: string }): Contact[] {
  const conditions: string[] = [];
  const params: string[] = [];

  if (filters.tag) {
    conditions.push("tags LIKE ?");
    params.push(`%${filters.tag}%`);
  }
  if (filters.company) {
    conditions.push("company = ?");
    params.push(filters.company);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  return db
    .prepare(`SELECT * FROM contacts ${where} ORDER BY name ASC`)
    .all(...params) as Contact[];
}

export function get(id: string): Contact | undefined {
  return db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Contact | undefined;
}

export function search(query: string, limit = 50): Contact[] {
  const pattern = `%${query}%`;
  return db
    .prepare(
      "SELECT * FROM contacts WHERE name LIKE ? OR email LIKE ? OR company LIKE ? OR tags LIKE ? ORDER BY name ASC LIMIT ?"
    )
    .all(pattern, pattern, pattern, pattern, limit) as Contact[];
}

export function create(fields: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  tags?: string;
}): Contact {
  const now = new Date().toISOString();
  const id = generateId();
  db.prepare(
    "INSERT INTO contacts (id, name, email, phone, company, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    fields.name,
    fields.email ?? null,
    fields.phone ?? null,
    fields.company ?? null,
    fields.tags ?? null,
    now,
    now
  );
  return get(id)!;
}

export function update(
  id: string,
  fields: { name?: string; email?: string }
): Contact | undefined {
  const existing = get(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const name = fields.name ?? existing.name;
  const email = fields.email !== undefined ? fields.email : existing.email;
  db.prepare(
    "UPDATE contacts SET name = ?, email = ?, updated_at = ? WHERE id = ?"
  ).run(name, email, now, id);
  return get(id)!;
}

export function del(id: string): boolean {
  return db.prepare("DELETE FROM contacts WHERE id = ?").run(id).changes > 0;
}
