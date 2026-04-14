import { NextRequest, NextResponse } from "next/server";
import { syncAllOrders } from "@/lib/sync";

export async function POST(req: NextRequest) {
  // Optional: protect with a simple secret
  const secret = process.env.WEBHOOK_SHARED_SECRET;
  if (secret) {
    const provided =
      req.headers.get("x-webhook-secret") ||
      req.nextUrl.searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const { synced, errors } = await syncAllOrders();
    return NextResponse.json({ synced, errors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
