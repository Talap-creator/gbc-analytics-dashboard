import { getOrders } from "./retailcrm";
import { getSupabaseServiceClient } from "./supabase";

interface RetailCRMItem {
  productName?: string;
  offer?: { displayName?: string; name?: string };
  quantity: number;
  initialPrice: number;
  prices?: { price: number; quantity: number }[];
}

function calcTotal(items: RetailCRMItem[]): number {
  return items.reduce((sum, item) => {
    const price = item.initialPrice ?? item.prices?.[0]?.price ?? 0;
    return sum + price * (item.quantity || 1);
  }, 0);
}

function mapOrder(o: any) {
  const items = o.items || [];
  const total = calcTotal(items);
  const contact = o.customer || o.contact || {};
  return {
    retailcrm_order_id: String(o.id),
    order_number: o.number || String(o.id),
    status: o.status || "unknown",
    order_type: o.orderType || null,
    order_method: o.orderMethod || null,
    first_name: o.firstName || contact.firstName || null,
    last_name: o.lastName || contact.lastName || null,
    phone: o.phone || contact.phones?.[0]?.number || null,
    email: o.email || contact.email || null,
    city: o.delivery?.address?.city || null,
    address_text: o.delivery?.address?.text || null,
    utm_source: o.customFields?.utm_source || null,
    items: items.map((i: any) => ({
      productName: i.offer?.displayName || i.offer?.name || i.productName || "—",
      quantity: i.quantity,
      initialPrice: i.initialPrice ?? i.prices?.[0]?.price ?? 0,
    })),
    item_count: items.length,
    total_amount: total,
    created_at_retailcrm: o.createdAt || null,
    updated_at_retailcrm: o.statusUpdatedAt || o.createdAt || null,
    synced_at: new Date().toISOString(),
  };
}

export async function syncAllOrders(): Promise<{
  synced: number;
  errors: string[];
}> {
  const supabase = getSupabaseServiceClient();
  let page = 1;
  let synced = 0;
  const errors: string[] = [];

  while (true) {
    const data = await getOrders(page, 100);
    const orders = data.orders || [];
    if (orders.length === 0) break;

    const mapped = orders.map(mapOrder);

    const { error } = await supabase.from("orders").upsert(mapped, {
      onConflict: "retailcrm_order_id",
    });

    if (error) {
      errors.push(`Page ${page}: ${error.message}`);
    } else {
      synced += mapped.length;
    }

    const totalPages = data.pagination?.totalPageCount || 1;
    if (page >= totalPages) break;
    page++;
  }

  return { synced, errors };
}

export { mapOrder, calcTotal };
