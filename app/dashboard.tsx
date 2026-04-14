"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Order {
  id: string;
  retailcrm_order_id: string;
  order_number: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  city: string | null;
  utm_source: string | null;
  total_amount: number;
  item_count: number;
  created_at_retailcrm: string | null;
}

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

function groupByDay(orders: Order[]) {
  const map = new Map<string, { date: string; count: number; revenue: number }>();
  for (const o of orders) {
    const raw = o.created_at_retailcrm;
    const day = raw ? raw.slice(0, 10) : "unknown";
    const entry = map.get(day) || { date: day, count: 0, revenue: 0 };
    entry.count++;
    entry.revenue += Number(o.total_amount) || 0;
    map.set(day, entry);
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function groupByField(orders: Order[], field: keyof Order) {
  const map = new Map<string, number>();
  for (const o of orders) {
    const key = (o[field] as string) || "Не указан";
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function formatMoney(n: number) {
  return n.toLocaleString("ru-RU") + " ₸";
}

export default function Dashboard({ orders }: { orders: Order[] }) {
  const totalRevenue = orders.reduce(
    (s, o) => s + (Number(o.total_amount) || 0),
    0
  );
  const totalOrders = orders.length;
  const avgCheck = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const dailyData = groupByDay(orders);
  const utmData = groupByField(orders, "utm_source");
  const statusData = groupByField(orders, "status");
  const cityData = groupByField(orders, "city");

  return (
    <div className="dashboard">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Заказов</span>
          <span className="kpi-value">{totalOrders}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Выручка</span>
          <span className="kpi-value">{formatMoney(totalRevenue)}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Средний чек</span>
          <span className="kpi-value">{formatMoney(Math.round(avgCheck))}</span>
        </div>
      </div>

      {/* Orders by Day */}
      <div className="chart-card">
        <h2>Заказы по дням</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return isNaN(d.getTime())
                  ? v
                  : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
              }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => [Number(value), "Заказов"]}
              labelFormatter={(label) => `Дата: ${label}`}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Day */}
      <div className="chart-card">
        <h2>Выручка по дням</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return isNaN(d.getTime())
                  ? v
                  : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
              }}
            />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value) => [formatMoney(Number(value)), "Выручка"]}
              labelFormatter={(label) => `Дата: ${label}`}
            />
            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie charts row */}
      <div className="charts-row">
        <div className="chart-card">
          <h2>Источники (UTM)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={utmData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {utmData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Статусы</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Города</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {cityData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Table */}
      <div className="chart-card">
        <h2>Последние заказы</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Клиент</th>
                <th>Город</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Источник</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {orders
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.created_at_retailcrm || 0).getTime() -
                    new Date(a.created_at_retailcrm || 0).getTime()
                )
                .slice(0, 20)
                .map((o) => (
                  <tr key={o.id}>
                    <td>{o.order_number}</td>
                    <td>
                      {[o.first_name, o.last_name].filter(Boolean).join(" ") ||
                        "—"}
                    </td>
                    <td>{o.city || "—"}</td>
                    <td className="mono">{formatMoney(Number(o.total_amount))}</td>
                    <td>
                      <span className={`badge badge-${o.status}`}>
                        {o.status}
                      </span>
                    </td>
                    <td>{o.utm_source || "—"}</td>
                    <td>
                      {o.created_at_retailcrm
                        ? new Date(o.created_at_retailcrm).toLocaleDateString(
                            "ru-RU"
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
