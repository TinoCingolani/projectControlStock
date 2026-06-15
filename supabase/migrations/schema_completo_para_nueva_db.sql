-- ─────────────────────────────────────────────────────────────────────────────
-- SCRIPT DE BASE DE DATOS COMPLETO DESDE CERO
-- Copiá y pegá este código en el "SQL Editor" de tu nuevo panel de Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Tabla de configuración global (config)
CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  dolar_ars DECIMAL(10,2) NOT NULL DEFAULT 1490.00,
  margen_minimo DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  alerta_stock_bajo INTEGER NOT NULL DEFAULT 3,
  dinero_cuenta DECIMAL(14,2) NOT NULL DEFAULT 13000.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial (con dinero_cuenta = $13.000)
INSERT INTO config (id, dolar_ars, margen_minimo, alerta_stock_bajo, dinero_cuenta) 
VALUES (1, 1490.00, 30.00, 3, 13000.00)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla de comisionistas (commissioners)
CREATE TABLE IF NOT EXISTS commissioners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de productos e inventario (products)
CREATE TABLE IF NOT EXISTS products (
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

-- 4. Tabla de ventas (sales)
CREATE TABLE IF NOT EXISTS sales (
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

-- 5. Habilitar la seguridad a nivel de fila (RLS - Row Level Security)
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissioners ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de acceso (RLS Policies - Acceso público y modificaciones sin auth para pruebas rápidas)
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
