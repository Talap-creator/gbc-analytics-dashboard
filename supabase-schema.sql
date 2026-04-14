-- Run this in Supabase SQL Editor to set up the schema

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  retailcrm_order_id TEXT UNIQUE NOT NULL,
  order_number TEXT,
  status TEXT,
  order_type TEXT,
  order_method TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  address_text TEXT,
  utm_source TEXT,
  items JSONB DEFAULT '[]',
  item_count INTEGER DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  created_at_retailcrm TIMESTAMPTZ,
  updated_at_retailcrm TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at_retailcrm);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON orders (utm_source);

-- Telegram notifications (de-dup table)
CREATE TABLE IF NOT EXISTS telegram_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  retailcrm_order_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (retailcrm_order_id, notification_type)
);

-- RLS: enable and allow public read on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_notifications ENABLE ROW LEVEL SECURITY;

-- Public read for dashboard (anon key)
CREATE POLICY "Allow public read on orders"
  ON orders FOR SELECT
  USING (true);

-- Only service role can insert/update orders
CREATE POLICY "Service role can manage orders"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');

-- Only service role can manage notifications
CREATE POLICY "Service role can manage notifications"
  ON telegram_notifications FOR ALL
  USING (auth.role() = 'service_role');
