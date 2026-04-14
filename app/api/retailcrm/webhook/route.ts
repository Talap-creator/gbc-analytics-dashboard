import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/retailcrm";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { mapOrder } from "@/lib/sync";
import { sendTelegramMessage, formatOrderNotification } from "@/lib/telegram";

const THRESHOLD = 50_000; // KZT

export async function POST(req: NextRequest) {
  // Validate webhook secret
  const secret = process.env.WEBHOOK_SHARED_SECRET;
  if (secret) {
    const provided =
      req.headers.get("x-webhook-secret") ||
      req.nextUrl.searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  let body: any;
  try {
    // RetailCRM can send form-encoded or JSON
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      const orderRaw = params.get("order");
      body = orderRaw ? JSON.parse(orderRaw) : Object.fromEntries(params);
    }
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  // Extract order ID — webhook payload varies by CRM config
  const orderId =
    body.id || body.order?.id || body.orderId || body.order_id;

  if (!orderId) {
    return NextResponse.json(
      { error: "Missing order ID in payload" },
      { status: 400 }
    );
  }

  try {
    // Fetch full order from RetailCRM
    const fullOrder = await getOrderById(orderId);
    if (!fullOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const mapped = mapOrder(fullOrder);
    const supabase = getSupabaseServiceClient();

    // Upsert order
    const { error: upsertError } = await supabase
      .from("orders")
      .upsert(mapped, { onConflict: "retailcrm_order_id" });

    if (upsertError) {
      console.error("Supabase upsert error:", upsertError);
      return NextResponse.json(
        { error: "DB upsert failed" },
        { status: 500 }
      );
    }

    // Telegram notification for large orders
    if (mapped.total_amount > THRESHOLD) {
      // Check for duplicate notification
      const { data: existing } = await supabase
        .from("telegram_notifications")
        .select("id")
        .eq("retailcrm_order_id", mapped.retailcrm_order_id)
        .eq("notification_type", "large_order")
        .maybeSingle();

      if (!existing) {
        const text = formatOrderNotification(mapped);
        const sent = await sendTelegramMessage(text);

        if (sent) {
          await supabase.from("telegram_notifications").insert({
            retailcrm_order_id: mapped.retailcrm_order_id,
            notification_type: "large_order",
            sent_at: new Date().toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ ok: true, order_id: mapped.retailcrm_order_id });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
