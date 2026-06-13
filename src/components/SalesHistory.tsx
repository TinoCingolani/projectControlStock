import { History, User, ShoppingBag, Trash2 } from 'lucide-react';
import type { Sale, Product, Commissioner } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SalesHistoryProps {
  sales: Sale[];
  products: Product[];
  commissioners: Commissioner[];
  deleteSale: (id: string) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
}

export function SalesHistory({ sales, products, commissioners, deleteSale, updateProduct }: SalesHistoryProps) {
  const handleDeleteSale = async (sale: Sale) => {
    if (!confirm('¿Eliminar esta venta? El stock será restaurado.')) return;

    const product = products.find(p => p.id === sale.product_id);
    if (product) {
      await updateProduct(product.id, { units_sold: Math.max(0, product.units_sold - sale.quantity) });
    }
    await deleteSale(sale.id);
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Producto desconocido';
  };

  const getCommissionerName = (commissionerId: string | null) => {
    if (!commissionerId) return null;
    const commissioner = commissioners.find(c => c.id === commissionerId);
    return commissioner?.name || 'Desconocido';
  };

  if (sales.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center gap-3 mb-6">
          <History className="w-5 h-5 text-rose-400" />
          <h2 className="text-lg font-semibold text-white">Historial de Ventas</h2>
        </div>
        <div className="text-center py-8 text-slate-500">
          <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No hay ventas registradas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <History className="w-5 h-5 text-rose-400" />
        <h2 className="text-lg font-semibold text-white">Historial de Ventas</h2>
        <span className="ml-auto text-sm text-slate-400">{sales.length} ventas</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left py-3 px-2">Fecha</th>
              <th className="text-left py-3 px-2">Producto</th>
              <th className="text-center py-3 px-2">Cant.</th>
              <th className="text-center py-3 px-2">Tipo</th>
              <th className="text-right py-3 px-2">Precio</th>
              <th className="text-right py-3 px-2">Comisión</th>
              <th className="text-right py-3 px-2">Gcia. Neta</th>
              <th className="text-center py-3 px-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b border-slate-700/50 hover:bg-slate-900/30">
                <td className="py-3 px-2 text-slate-300">
                  {new Date(sale.sold_at).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-2 text-white">{getProductName(sale.product_id)}</td>
                <td className="py-3 px-2 text-center text-white">{sale.quantity}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center justify-center gap-1">
                    {sale.sale_type === 'direct' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">
                        <User className="w-3 h-3" />
                        Directa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-400 rounded-full text-xs">
                        <ShoppingBag className="w-3 h-3" />
                        {getCommissionerName(sale.commissioner_id)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-2 text-right text-white">{formatCurrency(sale.sale_price)}</td>
                <td className="py-3 px-2 text-right text-rose-400">
                  {sale.commission_amount > 0 ? `-${formatCurrency(sale.commission_amount)}` : '-'}
                </td>
                <td className="py-3 px-2 text-right text-emerald-400 font-medium">{formatCurrency(sale.net_profit)}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteSale(sale)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Eliminar venta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
