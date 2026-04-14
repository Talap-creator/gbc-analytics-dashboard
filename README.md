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

**Live:** https://gbc-analytics-dashboard-steel.vercel.app

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

Ниже — реальная хронология работы с Claude Code. Промпты и что получилось.

### Промпт 1 — Старт проекта

> Скинул полное ТЗ + детальный план архитектуры (таблицы, API routes, скрипты, дашборд, env contract). Один промпт — вся структура.

**Результат:** Claude создал за один проход: `lib/` (supabase, retailcrm, telegram, sync), `scripts/` (import, sync), API routes (webhook, sync), дашборд на Recharts, SQL-схему, `.env.example`. Сборка прошла с первого раза после пары фиксов типов Recharts.

### Промпт 2 — Credentials и запуск

> Скинул API ключи RetailCRM, Supabase, Telegram. Попросил создать `.env.local` и запустить импорт.

**Результат:** Claude собрал `.env.local`, вытащил Supabase URL из JWT токена (я не мог найти URL в интерфейсе), запустил импорт.

### Промпт 3 — Ошибка API ключа

> Первый ключ RetailCRM давал 403. Скинул новый ключ.

**Результат:** Claude проверил ключ curl-запросом, подтвердил что работает, обновил `.env.local`.

### Промпт 4 — orderType не найден

> Импорт падал с ошибкой `"eshop-individual" does not exist`.

**Результат:** Claude сам запросил `/api/v5/reference/order-types`, нашёл что в демо-аккаунте доступен только тип `main`, и адаптировал скрипт. 50/50 заказов загружены.

### Промпт 5 — Синхронизация и Telegram

> Попросил синхронизировать в Supabase и проверить Telegram.

**Результат:** 50 заказов в Supabase, тестовое сообщение в Telegram отправлено. Кириллица через curl на Windows была битая, но Claude проверил через Node.js — в приложении всё ОК.

### Промпт 6 — Детальные уведомления

> Попросил сделать уведомления в Telegram подробнее — с товарами, контактами, адресом.

**Результат:** Переделал формат — теперь приходит полная карточка заказа с эмодзи, списком товаров, ценами, UTM-источником и ссылкой на CRM.

### Промпт 7 — README как в SolanaTrust

> Попросил переписать README в стиле моего другого проекта — с бейджами, ASCII-архитектурой, таблицами.

**Результат:** Полная переделка документации.

### Промпт 8 — Деплой и webhook

> Задеплоил на Vercel, скинул URL. Настроил триггер в RetailCRM по инструкции Claude.

**Результат:** Webhook заработал после фикса параметра `by=id` в RetailCRM API и добавления недостающих env vars на Vercel.

---

## Где застрял и как решил

| # | Проблема | Что было | Как решил |
|---|----------|----------|-----------|
| 1 | **API ключ RetailCRM** | Первый ключ давал 403 — "Wrong apiKey value" | Пересоздал ключ в настройках интеграции, новый заработал |
| 2 | **orderType не существует** | В `mock_orders.json` указан `eshop-individual`, а в демо-аккаунте такого нет | Claude запросил справочник через API, нашёл `main` — единственный доступный тип |
| 3 | **Supabase URL не найти** | В новом интерфейсе Supabase URL проекта спрятан | Claude вытащил `ref` из JWT service role ключа и собрал URL |
| 4 | **Supabase новые ключи** | У Supabase обновился формат ключей (`sb_publishable_...` вместо `eyJ...`), интерфейс поменялся | Нашёл publishable key в новом разделе "Publishable and secret API keys", использовал legacy anon key через вкладку |
| 5 | **Скрипты не видят env** | `npm run import:retailcrm` падал с "Invalid URL" — переменные окружения пустые | ES module hoisting: `import` выполняется до `dotenv.config()`. Переделали на ленивые геттеры |
| 6 | **Vercel 500 ошибка** | Дашборд на Vercel падал — `supabaseUrl is required`, `supabaseKey is required` | Забыл добавить `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` в Vercel env vars. Добавил — заработало |
| 7 | **Webhook не срабатывал** | Создал заказ в RetailCRM, но уведомление в Telegram не пришло | Триггер в CRM стоял с условием "Заказ оплачен = Да", а тестовые заказы не оплачены. Убрал условие |
| 8 | **Webhook 404 на заказ** | Webhook доходил до Vercel, но RetailCRM API отвечал "Not found" | API требует параметр `by=id` для получения заказа. Claude добавил, запушил, заработало |
| 9 | **Кириллица в Telegram** | Тестовое сообщение через curl показывало знаки вопроса | Проблема Windows curl + UTF-8. В самом приложении (Node.js fetch) кириллица работает нормально |
| 10 | **RetailCRM интерфейс** | Непривычный интерфейс CRM — долго искал где API ключи, триггеры, справочники | Разобрался: Настройки → Интеграция → API-ключи, Автоматизация → Триггеры |

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
