import { pool } from "@workspace/db";
import { logger } from "./logger";

/**
 * The api-server has no migration runner (and deploys straight from GitHub),
 * so new tables are created idempotently at boot. CREATE TABLE IF NOT EXISTS
 * is safe under concurrent boots. The drizzle schema in lib/db remains the
 * typed source of truth — keep this DDL in sync with it.
 */
const DDL = `
CREATE TABLE IF NOT EXISTS sponsored_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  name text NOT NULL,
  price text,
  category text NOT NULL,
  image_url text,
  url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sponsored_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES sponsored_products(id),
  device_id text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deal_search_usage (
  device_id text NOT NULL,
  day date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, day)
);
`;

export async function ensureTables(): Promise<void> {
  const client = await pool.connect();
  try {
    // Harmless on PG13+ (gen_random_uuid is built in); ignored if we lack
    // permission to install it.
    try {
      await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
    } catch (err) {
      logger.warn({ err }, "pgcrypto extension unavailable — continuing");
    }
    await client.query(DDL);
    logger.info("ensureTables: schema verified");
  } finally {
    client.release();
  }
}
