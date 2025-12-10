import "dotenv/config";
import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_PROD,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Unexpected Postgres client error", err);
});

export const db = drizzle(pool);
