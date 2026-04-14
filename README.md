# GBC Analytics Dashboard

Мини-дашборд заказов: RetailCRM → Supabase → Next.js (Vercel) + Telegram-уведомления.

## Архитектура

```
mock_orders.json → [скрипт] → RetailCRM → [скрипт/webhook] → Supabase → Next.js Dashboard
                                    ↓
                              Telegram Bot (заказы > 50 000 ₸)
```

## Стек

- **Next.js 16** (App Router, TypeScript)
- **Supabase** — хранение заказов, RLS-политики
- **Recharts** — графики на дашборде
- **RetailCRM API v5** — источник заказов
- **Telegram Bot API** — уведомления о крупных заказах
- **Vercel** — деплой

## Быстрый старт

### 1. Установи зависимости

```bash
npm install
```

### 2. Настрой переменные окружения

```bash
cp .env.example .env.local
```

Заполни `.env.local` своими ключами (RetailCRM, Supabase, Telegram).

### 3. Создай таблицы в Supabase

Выполни содержимое `supabase-schema.sql` в Supabase SQL Editor.

### 4. Загрузи заказы в RetailCRM

```bash
npm run import:retailcrm
```

### 5. Синхронизируй в Supabase

```bash
npm run sync:supabase
```

### 6. Запусти дашборд

```bash
npm run dev
```

Открой http://localhost:3000

## API Endpoints

| Endpoint | Метод | Описание |
|---|---|---|
| `/api/retailcrm/webhook` | POST | Webhook из RetailCRM — синхронизирует заказ и шлёт Telegram если сумма > 50 000 ₸ |
| `/api/sync` | POST | Полная синхронизация RetailCRM → Supabase |

## Webhook в RetailCRM

После деплоя на Vercel, настрой триггер в RetailCRM:
- URL: `https://your-app.vercel.app/api/retailcrm/webhook?secret=YOUR_WEBHOOK_SHARED_SECRET`
- Метод: POST
- Событие: создание заказа

## Переменные окружения

| Переменная | Описание |
|---|---|
| `RETAILCRM_BASE_URL` | URL аккаунта RetailCRM |
| `RETAILCRM_API_KEY` | API-ключ RetailCRM |
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon-ключ Supabase |
| `SUPABASE_URL` | URL проекта Supabase (серверный) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role ключ Supabase |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота |
| `TELEGRAM_CHAT_ID` | ID чата для уведомлений |
| `WEBHOOK_SHARED_SECRET` | Секрет для валидации webhook |

## Промпты для Claude Code

Основные промпты, которые использовались:

1. **Инициализация проекта** — передал ТЗ и детальный план реализации целиком, Claude Code создал всю структуру: lib/, scripts/, API routes, дашборд с Recharts, SQL-схему
2. **Отладка импорта** — RetailCRM отклонял `orderType: "eshop-individual"` — Claude Code запросил справочник типов через API, нашёл что в демо-аккаунте тип только `main`, и адаптировал скрипт
3. **Отладка env** — скрипты не видели переменные окружения (ES module hoisting проблема) — Claude Code поставил dotenv и переделал библиотеки на ленивое чтение env
4. **Проверка Telegram** — curl на Windows не передавал кириллицу, подтвердили через Node.js fetch что в приложении всё ОК

## Где застрял и как решил

- **RetailCRM API key** — первый ключ не работал (403), пересоздал новый — заработало
- **orderType не существует** — в демо-аккаунте нет `eshop-individual`, есть только `main`. Решение: запросил `/api/v5/reference/order-types` и подставил реальный код
- **dotenv + ES modules** — `import` поднимается выше `dotenv.config()`, поэтому переменные были `undefined`. Решение: переделал модули на ленивое чтение `process.env` через функции
