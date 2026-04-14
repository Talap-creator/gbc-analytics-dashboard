/**
 * One-time script: loads mock_orders.json into RetailCRM via API.
 *
 * Usage:
 *   npx tsx scripts/import-to-retailcrm.ts
 *
 * Required env vars: RETAILCRM_BASE_URL, RETAILCRM_API_KEY
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createOrder } from "../lib/retailcrm";
import orders from "../mock_orders.json";

async function main() {
  console.log(`Importing ${orders.length} orders into RetailCRM...`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];

    // Build the payload matching RetailCRM v5 order/create format
    // Map mock orderType to CRM's actual type code
    const payload: any = {
      orderType: "main",
      orderMethod: order.orderMethod,
      status: order.status,
      firstName: order.firstName,
      lastName: order.lastName,
      phone: order.phone,
      email: order.email,
      items: order.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        initialPrice: item.initialPrice,
      })),
    };

    if (order.delivery?.address) {
      payload.delivery = {
        address: {
          city: order.delivery.address.city,
          text: order.delivery.address.text,
        },
      };
    }

    if (order.customFields) {
      payload.customFields = order.customFields;
    }

    try {
      const result = await createOrder(payload);
      if (result.success) {
        success++;
        console.log(`  [${i + 1}/${orders.length}] OK — order id: ${result.id || "created"}`);
      } else {
        failed++;
        console.error(`  [${i + 1}/${orders.length}] FAIL:`, JSON.stringify(result));
      }
    } catch (err: any) {
      failed++;
      console.error(`  [${i + 1}/${orders.length}] ERROR:`, err.message);
    }

    // RetailCRM rate limit: ~10 req/s for demo accounts
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\nDone. Success: ${success}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
