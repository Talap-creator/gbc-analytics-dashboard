function getBaseUrl() {
  return process.env.RETAILCRM_BASE_URL!;
}
function getApiKey() {
  return process.env.RETAILCRM_API_KEY!;
}

interface RetailCRMResponse {
  success: boolean;
  orders?: any[];
  order?: any;
  pagination?: { totalCount: number; currentPage: number; totalPageCount: number };
  [key: string]: any;
}

export async function retailcrmGet(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<RetailCRMResponse> {
  const url = new URL(`/api/v5/${endpoint}`, getBaseUrl());
  url.searchParams.set("apiKey", getApiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RetailCRM GET ${endpoint} ${res.status}: ${text}`);
  }
  return res.json();
}

export async function retailcrmPost(
  endpoint: string,
  body: Record<string, string>
): Promise<RetailCRMResponse> {
  const url = new URL(`/api/v5/${endpoint}`, getBaseUrl());
  const form = new URLSearchParams();
  form.set("apiKey", getApiKey());
  for (const [k, v] of Object.entries(body)) {
    form.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RetailCRM POST ${endpoint} ${res.status}: ${text}`);
  }
  return res.json();
}

export async function createOrder(orderData: any): Promise<RetailCRMResponse> {
  return retailcrmPost("orders/create", {
    order: JSON.stringify(orderData),
  });
}

export async function getOrders(
  page = 1,
  limit = 100
): Promise<RetailCRMResponse> {
  return retailcrmGet("orders", {
    limit: String(limit),
    page: String(page),
  });
}

export async function getOrderById(id: string | number): Promise<any> {
  const data = await retailcrmGet(`orders/${id}`, { by: "id" });
  return data.order;
}
