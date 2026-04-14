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

interface OrderItem {
  productName: string;
  quantity: number;
  initialPrice: number;
}

export function formatOrderNotification(order: {
  retailcrm_order_id: string | number;
  order_number?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  total_amount: number;
  city?: string;
  address_text?: string;
  utm_source?: string;
  status?: string;
  items?: OrderItem[];
  item_count?: number;
  created_at_retailcrm?: string;
}): string {
  const name = [order.first_name, order.last_name].filter(Boolean).join(" ");
  const crmUrl = process.env.RETAILCRM_BASE_URL;
  const orderLink = crmUrl
    ? `<a href="${crmUrl}/orders/${order.retailcrm_order_id}/edit">#${order.order_number || order.retailcrm_order_id}</a>`
    : `#${order.order_number || order.retailcrm_order_id}`;

  const items = order.items || [];
  const itemLines = items.map(
    (item) =>
      `  • ${item.productName} × ${item.quantity} — ${(item.initialPrice * item.quantity).toLocaleString("ru-RU")} ₸`
  );

  const date = order.created_at_retailcrm
    ? new Date(order.created_at_retailcrm).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return [
    `🔔 <b>Новый крупный заказ!</b>`,
    ``,
    `📦 <b>Заказ:</b> ${orderLink}`,
    `💰 <b>Сумма: ${order.total_amount.toLocaleString("ru-RU")} ₸</b>`,
    ``,
    `👤 <b>Клиент</b>`,
    `Имя: ${name || "—"}`,
    order.phone ? `Тел: ${order.phone}` : null,
    order.email ? `Email: ${order.email}` : null,
    ``,
    order.city || order.address_text ? `📍 <b>Доставка</b>` : null,
    order.city ? `Город: ${order.city}` : null,
    order.address_text ? `Адрес: ${order.address_text}` : null,
    ``,
    items.length > 0 ? `🛒 <b>Товары (${items.length})</b>` : null,
    ...itemLines,
    ``,
    order.utm_source ? `📊 Источник: ${order.utm_source}` : null,
    order.status ? `📋 Статус: ${order.status}` : null,
    date ? `🕐 Создан: ${date}` : null,
  ]
    .filter((line) => line != null)
    .join("\n");
}
