import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Config, Commissioner, Product, Sale, ProductWithCalculated, DashboardStats } from '../types';
import { calculateProductMetrics, groupProductsByName } from '../utils/calculations';

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    const { data, error } = await supabase.from('config').select('*').eq('id', 1).single();
    if (!error && data) setConfig(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const updateConfig = async (updates: Partial<Config>) => {
    const { error } = await supabase.from('config').update(updates).eq('id', 1);
    if (!error) await fetchConfig();
    return !error;
  };

  return { config, loading, updateConfig, refetch: fetchConfig };
}

export function useCommissioners() {
  const [commissioners, setCommissioners] = useState<Commissioner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCommissioners = useCallback(async () => {
    const { data, error } = await supabase.from('commissioners').select('*').order('name');
    if (!error && data) setCommissioners(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCommissioners(); }, [fetchCommissioners]);

  const addCommissioner = async (name: string, commission_percent: number) => {
    const { error } = await supabase.from('commissioners').insert({ name, commission_percent });
    if (!error) await fetchCommissioners();
    return !error;
  };

  const updateCommissioner = async (id: string, updates: Partial<Commissioner>) => {
    const { error } = await supabase.from('commissioners').update(updates).eq('id', id);
    if (!error) await fetchCommissioners();
    return !error;
  };

  const deleteCommissioner = async (id: string) => {
    const { error } = await supabase.from('commissioners').delete().eq('id', id);
    if (!error) await fetchCommissioners();
    return !error;
  };

  return { commissioners, loading, addCommissioner, updateCommissioner, deleteCommissioner, refetch: fetchCommissioners };
}

export function useProducts(config: Config | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const productsWithCalculated: ProductWithCalculated[] = products.map(p => ({
    ...p,
    ...calculateProductMetrics(p, config || { dolar_ars: 1490 } as Config),
  }));

  const groupedProducts = groupProductsByName(productsWithCalculated);

  const addProduct = async (product: Omit<Product, 'id' | 'units_sold' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('products').insert({ ...product, units_sold: 0 });
    if (!error) await fetchProducts();
    return !error;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (!error) await fetchProducts();
    return !error;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) await fetchProducts();
    return !error;
  };

  return { products: productsWithCalculated, groupedProducts, loading, addProduct, updateProduct, deleteProduct, refetch: fetchProducts };
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    const { data, error } = await supabase.from('sales').select('*').order('sold_at', { ascending: false });
    if (!error && data) setSales(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const addSale = async (sale: Omit<Sale, 'id' | 'sold_at'>) => {
    const { error } = await supabase.from('sales').insert(sale);
    if (!error) await fetchSales();
    return !error;
  };

  const deleteSale = async (id: string) => {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (!error) await fetchSales();
    return !error;
  };

  return { sales, loading, addSale, deleteSale, refetch: fetchSales };
}

export function useDashboardStats(groupedProducts: ProductWithCalculated[], sales: Sale[], config: Config | null): DashboardStats {
  if (!config) {
    return {
      totalRealizedProfit: 0,
      totalFutureProfit: 0,
      totalPotentialProfit: 0,
      totalProducts: 0,
      lowStockProducts: 0,
      totalSales: 0,
      directSales: 0,
      commissionerSales: 0,
    };
  }

  const totalRealizedProfit = sales.reduce((sum, s) => sum + s.net_profit, 0);
  const totalFutureProfit = groupedProducts.reduce((sum, p) => sum + (p.profit_per_unit * p.stock_current), 0);
  const totalPotentialProfit = totalRealizedProfit + totalFutureProfit;
  const lowStockProducts = groupedProducts.filter(p => p.stock_current <= config.alerta_stock_bajo).length;
  const directSales = sales.filter(s => s.sale_type === 'direct').length;
  const commissionerSales = sales.filter(s => s.sale_type === 'commissioner').length;

  return {
    totalRealizedProfit,
    totalFutureProfit,
    totalPotentialProfit,
    totalProducts: groupedProducts.length,
    lowStockProducts,
    totalSales: sales.length,
    directSales,
    commissionerSales,
  };
}
