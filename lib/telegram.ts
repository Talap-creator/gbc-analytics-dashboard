const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("Telegram sendMessage failed:", err);
    return false;
  }
  return true;
}

export function formatOrderNotification(order: {
  retailcrm_order_id: string | number;
  order_number?: string;
  first_name?: string;
  last_name?: string;
  total_amount: number;
  city?: string;
  item_count?: number;
}): string {
  const name = [order.first_name, order.last_name].filter(Boolean).join(" ");
  return [
    `<b>Новый крупный заказ!</b>`,
    ``,
    `Заказ: #${order.order_number || order.retailcrm_order_id}`,
    `Клиент: ${name || "—"}`,
    `Сумма: <b>${order.total_amount.toLocaleString("ru-RU")} ₸</b>`,
    order.city ? `Город: ${order.city}` : null,
    order.item_count ? `Позиций: ${order.item_count}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
