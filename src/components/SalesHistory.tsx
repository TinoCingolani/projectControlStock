import { useState, useEffect } from 'react';
import { History, User, ShoppingBag, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Sale, Product, Commissioner } from '../types';
import { formatCurrency } from '../utils/calculations';

const PAGE_SIZE = 20;

interface SalesHistoryProps {
  sales: Sale[];
  products: Product[];
  commissioners: Commissioner[];
  deleteSale: (id: string) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
}

export function SalesHistory({ sales, products, commissioners, deleteSale, updateProduct }: SalesHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Resetear a página 1 si cambia la lista de ventas
  useEffect(() => { setCurrentPage(1); }, [sales.length]);

  const totalPages = Math.max(1, Math.ceil(sales.length / PAGE_SIZE));
  const paginatedSales = sales.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <History className="w-5 h-5 text-rose-400" />
        <h2 className="text-lg font-semibold text-white">Historial de Ventas</h2>
        <span className="ml-auto text-sm text-slate-400">{sales.length} ventas</span>
      </div>

      {/* Tabla — DESKTOP */}
      <div className="hidden sm:block overflow-x-auto">
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
            {paginatedSales.map((sale) => (
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

      {/* Cards — MOBILE */}
      <div className="sm:hidden space-y-3">
        {paginatedSales.map((sale) => (
          <div key={sale.id} className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/40">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-white text-sm">{getProductName(sale.product_id)}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(sale.sold_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  {' · '}
                  {sale.quantity} ud{sale.quantity !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sale.sale_type === 'direct' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded-full text-xs">
                    <User className="w-3 h-3" />Directa
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full text-xs">
                    <ShoppingBag className="w-3 h-3" />{getCommissionerName(sale.commissioner_id)}
                  </span>
                )}
                <button
                  onClick={() => handleDeleteSale(sale)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t border-slate-700/40 text-xs">
              <div className="flex-1">
                <p className="text-slate-500">Precio</p>
                <p className="text-white font-medium">{formatCurrency(sale.sale_price)}</p>
              </div>
              {sale.commission_amount > 0 && (
                <div className="flex-1">
                  <p className="text-slate-500">Comisión</p>
                  <p className="text-rose-400 font-medium">-{formatCurrency(sale.commission_amount)}</p>
                </div>
              )}
              <div className="flex-1">
                <p className="text-slate-500">Gcia. Neta</p>
                <p className="text-emerald-400 font-semibold">{formatCurrency(sale.net_profit)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Paginación estilo Apple ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700/50">
          {/* Botón Anterior */}
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                        transition-all duration-200 active:scale-95
                        ${currentPage === 1
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-700/0 hover:border-slate-600/50'
                        }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          {/* Contador de página */}
          <div className="flex items-center gap-2">
            {/* Dots para páginas pequeñas, números para más */}
            {totalPages <= 7 ? (
              Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200
                              ${page === currentPage
                                ? 'bg-slate-600 text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/40'
                              }`}
                >
                  {page}
                </button>
              ))
            ) : (
              <span className="text-sm text-slate-400 font-medium">
                Página <span className="text-white font-bold">{currentPage}</span> de <span className="text-white font-bold">{totalPages}</span>
              </span>
            )}
          </div>

          {/* Botón Siguiente */}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                        transition-all duration-200 active:scale-95
                        ${currentPage === totalPages
                          ? 'text-slate-600 cursor-not-allowed'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-700/0 hover:border-slate-600/50'
                        }`}
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info de registros */}
      {sales.length > 0 && (
        <p className="text-center text-xs text-slate-600 mt-3">
          Mostrando {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sales.length)} de {sales.length} ventas
        </p>
      )}
    </div>
  );
}
