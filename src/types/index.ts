export interface Config {
  id: number;
  dolar_ars: number;
  margen_minimo: number;
  alerta_stock_bajo: number;
  dinero_cuenta: number;
  updated_at: string;
}

export interface Commissioner {
  id: string;
  name: string;
  commission_percent: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  cost_usd: number;
  price_ars: number;
  stock_initial: number;
  units_sold: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  sale_type: 'direct' | 'commissioner';
  commissioner_id: string | null;
  sale_price: number;
  commission_amount: number;
  net_profit: number;
  sold_at: string;
}

export interface ProductWithCalculated extends Product {
  cost_ars: number;
  profit_per_unit: number;
  total_profit_potential: number;
  margin_percent: number;
  stock_current: number;
}

export interface DashboardStats {
  totalRealizedProfit: number;
  totalFutureProfit: number;
  totalPotentialProfit: number;
  totalProducts: number;
  lowStockProducts: number;
  totalSales: number;
  directSales: number;
  commissionerSales: number;
}

export interface ProjectionStats {
  totalCost: number;         // Inversión total en stock (costo_ars × stock_actual)
  totalRevenue: number;      // Recaudación bruta potencial (precio_ars × stock_actual)
  minProfit: number;         // Ganancia mínima si todo lo vende el comisionista seleccionado
  maxProfit: number;         // Ganancia máxima si todo lo vendo yo directamente
  commissionerName: string;  // Nombre del comisionista del peor caso
  commissionPercent: number; // Porcentaje de comisión del peor caso
}
