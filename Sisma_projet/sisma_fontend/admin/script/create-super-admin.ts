import { Pool } from "pg";
import fs from "fs";
import path from "path";

function loadEnvFromDotFile() {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "..", ".env"),
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const raw = fs.readFileSync(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex <= 0) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value.replace(/^"(.*)"$/, "$1");
      }
    }
  }
}

async function main() {
  loadEnvFromDotFile();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set. Please add it to admin/.env or environment.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    const username = "sisma@admin.ci";
    const password = "sismaadmin";

    const { rows } = await client.query("SELECT id FROM users WHERE username = $1 LIMIT 1", [username]);
    if (rows.length > 0) {
      console.log(`User '${username}' already exists (id=${rows[0].id}).`);
      return;
    }

    const insert = await client.query(
      "INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id",
      [username, password]
    );
    console.log(`Created user '${username}' with id=${insert.rows[0].id}`);
  } catch (err: any) {
    console.error("Failed to create user:", err.message || err);
    process.exitCode = 2;
  } finally {
    client.release();
    await pool.end();
  }
}

void main();
