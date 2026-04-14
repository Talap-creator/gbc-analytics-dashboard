<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/RetailCRM-API%20v5-blue" alt="RetailCRM"/>
  <img src="https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram" alt="Telegram Bot"/>
  <img src="https://img.shields.io/badge/deploy-Vercel-black?logo=vercel" alt="Vercel"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"/>
</p>

# GBC Analytics — Дашборд заказов

**Мини-дашборд заказов с real-time уведомлениями: RetailCRM → Supabase → Next.js + Telegram Bot.**

> Тестовое задание — AI Tools Specialist

---

## Что делает

Полный pipeline обработки заказов из RetailCRM с визуализацией и мгновенными уведомлениями:

- **Импорт** 50 тестовых заказов в RetailCRM через API
- **Синхронизация** заказов из RetailCRM в Supabase (upsert по ID, без дублей)
- **Дашборд** с графиками и KPI-метриками
- **Telegram-бот** — мгновенное уведомление при заказе > 50 000 ₸
- **Webhook** — автоматическая обработка новых заказов из RetailCRM

---

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  mock_orders.json│     │   RetailCRM      │     │    Supabase      │
│  50 заказов      │────▶│   API v5         │────▶│    PostgreSQL    │
└──────────────────┘     │                  │     │    + RLS         │
                         │   Webhook ──────────▶  └────────┬─────────┘
                         └──────────────────┘              │
                                │                          │
                         ┌──────┴──────┐          ┌────────▼─────────┐
                         │  Telegram   │          │   Next.js 16     │
                         │  Bot API    │          │   Dashboard      │
                         │  > 50k ₸    │          │   Recharts       │
                         └─────────────┘          └──────────────────┘
```

### Data Flow

```
1. import:retailcrm    mock_orders.json → RetailCRM (50 заказов)
2. sync:supabase       RetailCRM → Supabase (upsert by retailcrm_order_id)
3. Webhook (auto)      Новый заказ в CRM → Supabase + Telegram если > 50k ₸
4. Dashboard           Supabase → Next.js SSR → Recharts графики
```

---

## Dashboard

| Компонент | Описание |
|-----------|----------|
| KPI-карточки | Количество заказов, общая выручка, средний чек |
| График заказов | BarChart — количество заказов по дням |
| График выручки | BarChart — выручка по дням (₸) |
| UTM-источники | PieChart — распределение по utm_source |
| Статусы | PieChart — распределение по статусам |
| Города | PieChart — распределение по городам |
| Таблица | Последние 20 заказов с деталями |

---

## API Endpoints

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/retailcrm/webhook` | POST | Webhook из RetailCRM — upsert заказа + Telegram при > 50k ₸ |
| `/api/sync` | POST | Полная синхронизация RetailCRM → Supabase |

Webhook защищён `WEBHOOK_SHARED_SECRET` через header `x-webhook-secret` или query `?secret=`.

---

## Quick Start

### 1. Установка

```bash
git clone https://github.com/Talap-creator/gbc-analytics-dashboard.git
cd gbc-analytics-dashboard
npm install
```

### 2. Переменные окружения

```bash
cp .env.example .env.local
```

Заполни `.env.local`:

```
RETAILCRM_BASE_URL=https://yourshop.retailcrm.ru
RETAILCRM_API_KEY=your_api_key
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TELEGRAM_BOT_TOKEN=123456:ABC-DEF
TELEGRAM_CHAT_ID=123456789
WEBHOOK_SHARED_SECRET=your_random_secret
```

### 3. База данных

Выполни `supabase-schema.sql` в Supabase SQL Editor — создаст таблицы `orders` и `telegram_notifications` с индексами и RLS.

### 4. Импорт и синхронизация

```bash
npm run import:retailcrm   # mock_orders.json → RetailCRM (50 заказов)
npm run sync:supabase       # RetailCRM → Supabase
```

### 5. Запуск

```bash
npm run dev                 # http://localhost:3000
```

---

## Supabase Schema

| Таблица | Назначение |
|---------|-----------|
| `orders` | Заказы из RetailCRM (upsert по `retailcrm_order_id`) |
| `telegram_notifications` | Дедупликация уведомлений (unique: order_id + type) |

**RLS-политики:**
- `orders` — публичное чтение (для дашборда), запись только service_role
- `telegram_notifications` — только service_role

---

## Webhook в RetailCRM

После деплоя на Vercel настрой HTTP-триггер в RetailCRM:

| Параметр | Значение |
|----------|---------|
| URL | `https://your-app.vercel.app/api/retailcrm/webhook?secret=YOUR_SECRET` |
| Метод | POST |
| Событие | Создание заказа |

При получении webhook:
1. Загружает полную карточку заказа из RetailCRM
2. Upsert в Supabase
3. Если сумма > 50 000 ₸ — отправляет уведомление в Telegram (с дедупликацией)

---

## Tech Stack

| Компонент | Технология |
|-----------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Charts | Recharts 3 |
| Database | Supabase (PostgreSQL + RLS) |
| CRM | RetailCRM API v5 |
| Notifications | Telegram Bot API |
| Deploy | Vercel |
| Scripts | tsx (TypeScript runner) |

---

## Промпты для Claude Code

| # | Промпт | Результат |
|---|--------|----------|
| 1 | Передал полное ТЗ + детальный план архитектуры | Создал всю структуру за один проход: lib/, scripts/, API routes, дашборд, SQL-схему |
| 2 | Запустил импорт — ошибка `orderType not found` | Claude запросил справочник через API, нашёл что в демо `eshop-individual` → `main`, адаптировал |
| 3 | Скрипты не видели env vars | Диагностировал ES module hoisting, установил dotenv, переделал на ленивое чтение |
| 4 | Кириллица в Telegram битая | Определил что проблема только в curl на Windows, подтвердил через Node.js fetch |

## Где застрял и как решил

| Проблема | Причина | Решение |
|----------|---------|---------|
| API key 403 | Первый ключ оказался невалидным | Пересоздал ключ в RetailCRM |
| `orderType` does not exist | В демо-аккаунте нет `eshop-individual` | Запросил `/reference/order-types`, подставил `main` |
| `Invalid URL` при импорте | ES module hoisting — `process.env` читается до `dotenv.config()` | Переделал модули на функции-геттеры вместо top-level констант |
| Кракозябры в Telegram | Windows curl некорректно отправляет UTF-8 | Проблема только в тесте, в Node.js приложении кириллица ОК |

---

## Scripts

```bash
npm run dev                # Запуск dev-сервера
npm run build              # Production сборка
npm run import:retailcrm   # Импорт mock_orders.json → RetailCRM
npm run sync:supabase      # Синхронизация RetailCRM → Supabase
```

---

## License

MIT
