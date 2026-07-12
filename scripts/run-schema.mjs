import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use direct connection for DDL (not the pooler)
// Direct connection format: postgres://postgres:{password}@db.{ref}.supabase.co:5432/postgres
const poolerUrl = process.env.DATABASE_URL;
const password = poolerUrl.split(':')[2].split('@')[0];
const ref = poolerUrl.match(/postgres\.([^:]+):/)?.[1];
const connectionString = `postgresql://postgres:${password}@db.${ref}.supabase.co:5432/postgres`;

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf-8");

  // Split by semicolons but handle the function body which contains semicolons
  // Instead, run the whole file as one statement block
  console.log("Connecting to database...");
  await client.connect();

  try {
    console.log("Running schema...");
    await client.query(sql);
    console.log("Schema applied successfully!");
  } catch (err) {
    console.error("Error applying schema:", err.message);
    // Try running statements individually if batch fails
    if (err.message.includes("cannot insert multiple commands")) {
      console.log("Retrying with individual statements...");
      // Split on semicolons that are at the end of a line (not inside function bodies)
      const statements = sql
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith("--"));

      for (const stmt of statements) {
        try {
          await client.query(stmt);
          console.log("  OK:", stmt.slice(0, 60).replace(/\n/g, " ") + "...");
        } catch (stmtErr) {
          console.error("  WARN:", stmtErr.message, "for:", stmt.slice(0, 60).replace(/\n/g, " "));
        }
      }
      console.log("Done (with some possible warnings above).");
    }
  } finally {
    await client.end();
  }
}

run();
