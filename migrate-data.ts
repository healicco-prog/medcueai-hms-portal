import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "https://nnolyyuvhdoyqmnlgwry.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Add it to .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const db = new Database("aimsrc.db");

const tables = [
  "institutions",
  "departments",
  "role_permissions",
  "users", // depends on institutions
  "formulary",
  "essential_medicines",
  "institute_essential_medicines",
  "prescriptions", // depends on users
  "med_error_prescriptions",
  "adr_reports",
  "consolidated_reports",
  "med_error_consolidated_reports",
  "cds_audits", // depends on users
];

async function migrate() {
  console.log("Starting SQLite to Supabase migration...");

  for (const table of tables) {
    try {
      const rows = db.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) {
        console.log(`Table ${table} is empty, skipping.`);
        continue;
      }
      
      console.log(`Migrating ${rows.length} rows to ${table}...`);
      
      // Batch insert to avoid huge payloads if tables are large
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        // Supabase will automatically map id columns if we push them, as long as they don't violate pk constraint
        const { error } = await supabase.from(table).insert(batch);
        if (error) {
          console.error(`Error inserting into ${table}:`, error);
        }
      }
      console.log(`Successfully migrated ${table}.`);
    } catch (err) {
      console.error(`Skipping ${table} due to error (might not exist):`, err);
    }
  }
  
  console.log("Migration complete.");
}

migrate();
