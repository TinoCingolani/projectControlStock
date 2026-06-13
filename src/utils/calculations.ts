import type { Product, Config, ProductWithCalculated, Commissioner, ProjectionStats } from '../types';

export function calculateProductMetrics(product: Product, config: Config) {
  const costArs = product.cost_usd * config.dolar_ars;
  const profitPerUnit = product.price_ars - costArs;
  const totalProfitPotential = profitPerUnit * product.quantity;
  const marginPercent = product.price_ars > 0
    ? (profitPerUnit / product.price_ars) * 100
    : 0;
  const stockCurrent = product.stock_initial - product.units_sold;

  return {
    cost_ars: costArs,
    profit_per_unit: profitPerUnit,
    total_profit_potential: totalProfitPotential,
    margin_percent: marginPercent,
    stock_current: stockCurrent,
  };
}

export function formatCurrency(value: number, currency: 'ARS' | 'USD' = 'ARS'): string {
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return currency === 'USD' ? `USD ${formatted}` : `$${formatted}`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function isLowStock(stock: number, threshold: number): boolean {
  return stock <= threshold;
}

export function isMarginLow(margin: number, threshold: number): boolean {
  return margin < threshold;
}

export function groupProductsByName(products: ProductWithCalculated[]): ProductWithCalculated[] {
  const map = new Map<string, ProductWithCalculated>();
  
  // Sort products by created_at ascending (oldest first) so that the newest one overrides prices
  const sortedProducts = [...products].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  sortedProducts.forEach(p => {
    const key = p.name.toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, { ...p });
    } else {
      const existing = map.get(key)!;
      existing.quantity += p.quantity;
      existing.stock_initial += p.stock_initial;
      existing.units_sold += p.units_sold;
      existing.stock_current += p.stock_current;
      // Use the newest product's pricing and ID
      existing.cost_usd = p.cost_usd;
      existing.price_ars = p.price_ars;
      existing.cost_ars = p.cost_ars;
      existing.profit_per_unit = p.profit_per_unit;
      existing.margin_percent = p.margin_percent;
      existing.id = p.id;
    }
  });
  
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Calculates four financial projection metrics over the current stock.
 *
 * @param groupedProducts  - Aggregated product list (one row per product name)
 * @param commissioner     - Commissioner for the "worst case" scenario (all sales via them)
 */
export function calculateProjection(
  groupedProducts: ProductWithCalculated[],
  commissioner: Commissioner | null,
): ProjectionStats {
  let totalCost    = 0;
  let totalRevenue = 0;
  let maxProfit    = 0; // Vendo Yo: price - cost, no commission
  let minProfit    = 0; // Vende Octa: price - cost - commission

  for (const p of groupedProducts) {
    const stock = Math.max(0, p.stock_current);
    if (stock === 0) continue;

    const costTotal    = p.cost_ars * stock;
    const revenueTotal = p.price_ars * stock;
    const grossProfit  = revenueTotal - costTotal;

    const commissionAmount = commissioner
      ? revenueTotal * (commissioner.commission_percent / 100)
      : 0;

    totalCost    += costTotal;
    totalRevenue += revenueTotal;
    maxProfit    += grossProfit;
    minProfit    += grossProfit - commissionAmount;
  }

  return {
    totalCost,
    totalRevenue,
    maxProfit,
    minProfit,
    commissionerName:   commissioner?.name           ?? '—',
    commissionPercent:  commissioner?.commission_percent ?? 0,
  };
}
