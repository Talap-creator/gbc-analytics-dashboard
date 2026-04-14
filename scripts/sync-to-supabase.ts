/**
 * Sync script: fetches all orders from RetailCRM and upserts into Supabase.
 *
 * Usage:
 *   npx tsx scripts/sync-to-supabase.ts
 *
 * Required env vars:
 *   RETAILCRM_BASE_URL, RETAILCRM_API_KEY,
 *   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { syncAllOrders } from "../lib/sync";

async function main() {
  console.log("Syncing RetailCRM orders → Supabase...");
  const { synced, errors } = await syncAllOrders();
  console.log(`Synced: ${synced} orders`);
  if (errors.length > 0) {
    console.error("Errors:", errors);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
