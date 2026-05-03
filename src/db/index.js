import "dotenv/config";
import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import logger from "../utils/logger.js";

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_PROD,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  logger.error({ err }, "Unexpected Postgres client error");
});

export const db = drizzle(pool);
