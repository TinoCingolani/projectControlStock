-- Configuration table for global settings
CREATE TABLE config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  dolar_ars DECIMAL(10,2) NOT NULL DEFAULT 1490.00,
  margen_minimo DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  alerta_stock_bajo INTEGER NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config
INSERT INTO config (id, dolar_ars, margen_minimo, alerta_stock_bajo) 
VALUES (1, 1490.00, 30.00, 3);

-- Commissioners table
CREATE TABLE commissioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products/Orders table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  cost_usd DECIMAL(10,2) NOT NULL,
  price_ars DECIMAL(12,2) NOT NULL,
  stock_initial INTEGER NOT NULL,
  units_sold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  sale_type TEXT NOT NULL CHECK (sale_type IN ('direct', 'commissioner')),
  commissioner_id UUID REFERENCES commissioners(id) ON DELETE SET NULL,
  sale_price DECIMAL(12,2) NOT NULL,
  commission_amount DECIMAL(12,2) DEFAULT 0,
  net_profit DECIMAL(12,2) NOT NULL,
  sold_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public access for authenticated users)
CREATE POLICY "config_select" ON config FOR SELECT USING (true);
CREATE POLICY "config_update" ON config FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "commissioners_select" ON commissioners FOR SELECT USING (true);
CREATE POLICY "commissioners_insert" ON commissioners FOR INSERT WITH CHECK (true);
CREATE POLICY "commissioners_update" ON commissioners FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "commissioners_delete" ON commissioners FOR DELETE USING (true);

CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "products_update" ON products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "products_delete" ON products FOR DELETE USING (true);

CREATE POLICY "sales_select" ON sales FOR SELECT USING (true);
CREATE POLICY "sales_insert" ON sales FOR INSERT WITH CHECK (true);
CREATE POLICY "sales_delete" ON sales FOR DELETE USING (true);
