import { useState, useMemo } from 'react';
import {
  Package, TrendingUp, Plus, X, User, ShoppingBag,
  Search, CheckCircle2, DollarSign,
} from 'lucide-react';
import type { ProductWithCalculated, Commissioner, Sale, Config } from '../types';
import { formatCurrency, isLowStock } from '../utils/calculations';
import { AlertsPanel } from './AlertsPanel';

interface SalesPanelProps {
  products: ProductWithCalculated[];
  groupedProducts: ProductWithCalculated[];
  commissioners: Commissioner[];
  sales: Sale[];
  config: Config | null;
  addSale: (sale: Omit<Sale, 'id' | 'sold_at'>) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<ProductWithCalculated>) => Promise<boolean>;
}

type ModalState = 'form' | 'saving' | 'success';

export function SalesPanel({ products, groupedProducts, commissioners, sales, config, addSale, updateProduct }: SalesPanelProps) {
  const [showSaleModal, setShowSaleModal]     = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [unitPriceInput, setUnitPriceInput]   = useState('');
  const [saleQuantity, setSaleQuantity]       = useState('1');
  const [saleType, setSaleType]               = useState<'direct' | 'commissioner'>('direct');
  const [selectedCommissioner, setSelectedCommissioner] = useState('');
  const [customCommPct, setCustomCommPct]     = useState('');  // % comisión editable por venta
  const [modalState, setModalState]           = useState<ModalState>('form');
  const [searchQuery, setSearchQuery]         = useState('');

  /* ── Editar producto desde alerta ── */
  const [editingAlertProduct, setEditingAlertProduct] = useState<ProductWithCalculated | null>(null);
  const [replenishQty, setReplenishQty]       = useState('');
  const [replenishSaving, setReplenishSaving] = useState(false);

  /* ── Filtro de búsqueda ── */
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groupedProducts;
    return groupedProducts.filter(p => p.name.toLowerCase().includes(q));
  }, [groupedProducts, searchQuery]);

  /* ── Derivados del modal de venta ── */
  const selectedProductObj = groupedProducts.find(p => p.id === selectedProduct);
  const selectedCommObj    = commissioners.find(c => c.id === selectedCommissioner);
  const qty                = Math.max(1, parseInt(saleQuantity) || 1);

  // Porcentaje de comisión efectivo: el campo editable tiene prioridad; si está vacío usa el del comisionista
  const effectiveCommPct = (() => {
    const parsed = parseFloat(customCommPct);
    if (!isNaN(parsed) && customCommPct.trim() !== '') return parsed;
    return selectedCommObj?.commission_percent ?? 0;
  })();

  const salePreview = selectedProductObj ? (() => {
    const parsedPrice  = parseFloat(unitPriceInput);
    const unitPrice    = !isNaN(parsedPrice) ? parsedPrice : selectedProductObj.price_ars;
    const totalSale    = unitPrice * qty;
    const commission   = saleType === 'commissioner' && selectedCommObj
      ? totalSale * (effectiveCommPct / 100)
      : 0;
    const netProfit    = ((unitPrice - selectedProductObj.cost_ars) * qty) - commission;
    const stockOk      = qty <= selectedProductObj.stock_current;
    return { totalSale, commission, netProfit, stockOk, unitPrice };
  })() : null;

  
  // Custom function for row to avoid recalculating name match if not needed
  const getGroupSales = (productName: string) => sales.filter(s => {
      const p = products.find(prod => prod.id === s.product_id);
      return p && p.name.toLowerCase() === productName.toLowerCase();
  });

  /* ── Registrar venta ── */
  const handleRegisterSale = async () => {
    if (!selectedProductObj || !config || !salePreview?.stockOk) return;
    setModalState('saving');

    const success1 = await addSale({
      product_id:        selectedProduct, // usamos el ID del lote más reciente
      quantity:          qty,
      sale_type:         saleType,
      commissioner_id:   saleType === 'commissioner' ? selectedCommissioner : null,
      sale_price:        salePreview.totalSale,
      commission_amount: salePreview.commission,
      net_profit:        salePreview.netProfit,
    });

    let remainingQty = qty;
    let success2 = true;
    
    // Buscar todos los lotes originales de este producto (los más antiguos primero para FIFO)
    const matchingBatches = products
      .filter(p => p.name.toLowerCase() === selectedProductObj.name.toLowerCase())
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    for (const batch of matchingBatches) {
      if (remainingQty <= 0) break;
      if (batch.stock_current > 0) {
        const toDeduct = Math.min(batch.stock_current, remainingQty);
        const ok = await updateProduct(batch.id, {
          units_sold: batch.units_sold + toDeduct,
        });
        if (!ok) success2 = false;
        remainingQty -= toDeduct;
      }
    }

    if (success1 && success2) {
      setModalState('success');
      setTimeout(() => closeSaleModal(), 1400);
    } else {
      setModalState('form');
    }
  };

  const closeSaleModal = () => {
    setShowSaleModal(false);
    setSelectedProduct('');
    setUnitPriceInput('');
    setSaleQuantity('1');
    setSaleType('direct');
    setSelectedCommissioner('');
    setCustomCommPct('');
    setModalState('form');
  };

  /* ── Reponer stock desde alerta ── */
  const handleReplenish = async () => {
    if (!editingAlertProduct) return;
    const newQty = parseInt(replenishQty);
    if (!newQty || newQty <= 0) return;
    setReplenishSaving(true);
    
    // Buscamos el lote más reciente (que es el ID que tiene editingAlertProduct) y le sumamos.
    // También podríamos crear un lote nuevo, pero como es una edición rápida, le sumamos al último.
    // Wait, editingAlertProduct is from groupedProducts, so its ID is the latest batch.
    const latestBatch = products.find(p => p.id === editingAlertProduct.id);
    if (latestBatch) {
      await updateProduct(latestBatch.id, {
        quantity:      latestBatch.quantity + newQty,
        stock_initial: latestBatch.stock_initial + newQty,
      });
    }
    
    setReplenishSaving(false);
    setEditingAlertProduct(null);
    setReplenishQty('');
  };

  /* ── Render ── */
  return (
    <div className="space-y-0">

      {/* ══ Alertas de Reposición ══ */}
      <AlertsPanel
        products={groupedProducts}
        config={config}
        onEditProduct={(p) => { setEditingAlertProduct(p); setReplenishQty(''); }}
      />

      {/* ══ Panel principal ══ */}
      <div className="card animate-fade-in">
        {/* Header */}
        <div className="section-header">
          <div className="section-title">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <span>Stock y Seguimiento de Ventas</span>
          </div>
          <button
            onClick={() => setShowSaleModal(true)}
            disabled={products.length === 0}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-amber-900/30 hover:shadow-amber-700/40 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Registrar Venta
          </button>
        </div>

        {/* Buscador */}
        {products.length > 0 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar producto por nombre..."
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Tabla vacía */}
        {products.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Package className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No hay productos en el inventario</p>
            <p className="text-sm mt-1 text-slate-600">Agregá productos desde la sección "Pedidos"</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>Sin resultados para "<span className="text-slate-400">{searchQuery}</span>"</p>
          </div>
        ) : (
          <>
            {/* ── Vista DESKTOP: tabla ── */}
            <div className="hidden sm:block overflow-x-auto rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-4 bg-slate-900/40 rounded-tl-xl">Producto</th>
                    <th className="text-center py-3 px-3 bg-slate-900/40">Inicial</th>
                    <th className="text-center py-3 px-3 bg-slate-900/40">Vendidas</th>
                    <th className="text-center py-3 px-3 bg-slate-900/40">Actual</th>
                    <th className="text-center py-3 px-3 bg-slate-900/40">Estado</th>
                    <th className="text-right py-3 px-3 bg-slate-900/40">Gcias. Realizadas</th>
                    <th className="text-right py-3 px-4 bg-slate-900/40 rounded-tr-xl">Gcias. Futuras</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => {
                    const lowStock        = config && isLowStock(p.stock_current, config.alerta_stock_bajo);
                    const noStock         = p.stock_current <= 0;
                    const realizedProfit  = getGroupSales(p.name).reduce((sum, s) => sum + s.net_profit, 0);
                    const futureProfit    = p.profit_per_unit * p.stock_current;

                    return (
                      <tr
                        key={p.id}
                        className={`border-b border-slate-700/30 transition-colors hover:bg-slate-700/20 ${
                          noStock ? 'row-no-stock' : lowStock ? 'row-low-stock' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-white">{p.name}</p>
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-400">{p.stock_initial}</td>
                        <td className="py-3.5 px-3 text-center text-white">{p.units_sold}</td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`text-lg font-bold tabular-nums ${
                            noStock ? 'text-rose-400' : lowStock ? 'text-amber-400' : 'text-white'
                          }`}>
                            {p.stock_current}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {noStock ? (
                            <span className="badge-critical">Sin stock</span>
                          ) : lowStock ? (
                            <span className="badge-low">Reponer</span>
                          ) : (
                            <span className="badge-ok">OK</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="text-emerald-400 font-semibold">{formatCurrency(realizedProfit)}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-cyan-400">{formatCurrency(futureProfit)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Vista MOBILE: cards ── */}
            <div className="sm:hidden space-y-3">
              {filteredProducts.map((p) => {
                const lowStock       = config && isLowStock(p.stock_current, config.alerta_stock_bajo);
                const noStock        = p.stock_current <= 0;
                const realizedProfit = getGroupSales(p.name).reduce((sum, s) => sum + s.net_profit, 0);
                const futureProfit   = p.profit_per_unit * p.stock_current;

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      noStock
                        ? 'bg-rose-950/20 border-rose-500/25'
                        : lowStock
                        ? 'bg-amber-950/20 border-amber-500/20'
                        : 'bg-slate-900/40 border-slate-700/40'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-semibold text-white text-sm">{p.name}</p>
                      {noStock ? (
                        <span className="badge-critical">Sin stock</span>
                      ) : lowStock ? (
                        <span className="badge-low">Reponer</span>
                      ) : (
                        <span className="badge-ok">OK</span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-0.5">Inicial</p>
                        <p className="text-sm font-medium text-slate-300">{p.stock_initial}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-0.5">Vendidas</p>
                        <p className="text-sm font-medium text-white">{p.units_sold}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-0.5">Actual</p>
                        <p className={`text-lg font-bold tabular-nums ${
                          noStock ? 'text-rose-400' : lowStock ? 'text-amber-400' : 'text-white'
                        }`}>{p.stock_current}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2 border-t border-slate-700/40">
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Realizadas</p>
                        <p className="text-sm font-semibold text-emerald-400">{formatCurrency(realizedProfit)}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">Futuras</p>
                        <p className="text-sm font-semibold text-cyan-400">{formatCurrency(futureProfit)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ══ Modal: Registrar Venta ══ */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700/60 shadow-2xl animate-slide-up overflow-hidden">

            {/* Success state */}
            {modalState === 'success' ? (
              <div className="flex flex-col items-center justify-center py-16 px-8 animate-success">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>
                <p className="text-xl font-bold text-white mb-1">¡Venta registrada!</p>
                <p className="text-slate-400 text-sm">El stock fue descontado automáticamente</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    <h3 className="text-lg font-bold text-white">Registrar Venta</h3>
                  </div>
                  <button
                    onClick={closeSaleModal}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Producto */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
                      Producto
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={e => {
                        const prodId = e.target.value;
                        setSelectedProduct(prodId);
                        setSaleQuantity('1');
                        const prod = groupedProducts.find(p => p.id === prodId);
                        setUnitPriceInput(prod ? prod.price_ars.toString() : '');
                      }}
                      className="input"
                    >
                      <option value="">Seleccionar producto...</option>
                      {groupedProducts.filter(p => p.stock_current > 0).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Stock: {p.stock_current} — {formatCurrency(p.price_ars)}
                        </option>
                      ))}
                    </select>
                    {selectedProductObj && (
                      <p className="text-xs mt-1.5 text-slate-500">
                        Precio unitario de lista: <span className="text-slate-300 font-medium">{formatCurrency(selectedProductObj.price_ars)}</span>
                        {' · '}Stock disponible:
                        <span className={`font-medium ml-1 ${
                          selectedProductObj.stock_current <= 3 ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          {selectedProductObj.stock_current} uds.
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={saleQuantity}
                      onChange={e => setSaleQuantity(e.target.value)}
                      className={`input ${
                        salePreview && !salePreview.stockOk
                           ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-500/20'
                           : ''
                      }`}
                      min="1"
                      max={selectedProductObj?.stock_current}
                    />
                    {salePreview && !salePreview.stockOk && (
                      <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                        ⚠ Stock insuficiente — máximo {selectedProductObj?.stock_current} unidades
                      </p>
                    )}
                  </div>

                  {/* Precio Unitario de Venta */}
                  {selectedProductObj && (
                    <div className="animate-fade-in">
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs text-slate-400 font-medium uppercase tracking-wide">
                          Precio Unitario de Venta
                        </label>
                        <span className="text-xs text-slate-500">
                          Lista: {formatCurrency(selectedProductObj.price_ars)}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                        <input
                          type="number"
                          value={unitPriceInput}
                          onChange={e => setUnitPriceInput(e.target.value)}
                          className="input pl-8"
                          placeholder="0.00"
                          step="any"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tipo de venta */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
                      Tipo de Venta
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { setSaleType('direct'); setSelectedCommissioner(''); }}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 text-sm font-medium ${
                          saleType === 'direct'
                            ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-900/20'
                            : 'bg-slate-900/50 border-slate-600/50 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <User className="w-4 h-4" />
                        Directa
                      </button>
                      <button
                        onClick={() => setSaleType('commissioner')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 text-sm font-medium ${
                          saleType === 'commissioner'
                            ? 'bg-violet-600/20 border-violet-500/50 text-violet-400 shadow-lg shadow-violet-900/20'
                            : 'bg-slate-900/50 border-slate-600/50 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Vendedor
                      </button>
                    </div>
                  </div>

                  {/* Vendedor + % editable */}
                  {saleType === 'commissioner' && (
                    <div className="animate-fade-in space-y-3">
                      {/* Selector de vendedor */}
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
                          Vendedor
                        </label>
                        <select
                          value={selectedCommissioner}
                          onChange={e => {
                            const commId = e.target.value;
                            setSelectedCommissioner(commId);
                            // Pre-llenar con la tasa base del vendedor seleccionado
                            const comm = commissioners.find(c => c.id === commId);
                            setCustomCommPct(comm ? comm.commission_percent.toString() : '');
                          }}
                          className="input"
                        >
                          <option value="">Seleccionar vendedor...</option>
                          {commissioners.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.commission_percent}% base)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* % de comisión ajustable por producto/venta */}
                      {selectedCommissioner && (
                        <div className="animate-fade-in">
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-xs text-violet-400 font-medium uppercase tracking-wide">
                              % Comisión para esta venta
                            </label>
                            {selectedCommObj && customCommPct !== selectedCommObj.commission_percent.toString() && (
                              <button
                                onClick={() => setCustomCommPct(selectedCommObj.commission_percent.toString())}
                                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                Restablecer ({selectedCommObj.commission_percent}%)
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              value={customCommPct}
                              onChange={e => setCustomCommPct(e.target.value)}
                              className="input pr-8"
                              placeholder={selectedCommObj?.commission_percent.toString() ?? '0'}
                              min="0"
                              max="100"
                              step="0.5"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Resumen automático de la venta ── */}
                  {salePreview && selectedProductObj && (
                    <div className="sale-summary animate-fade-in">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Resumen de la venta</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">
                            {qty} × {formatCurrency(salePreview.unitPrice)}
                          </span>
                          <span className="text-white font-medium">{formatCurrency(salePreview.totalSale)}</span>
                        </div>

                        {salePreview.commission > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">
                              Comisión ({effectiveCommPct}%
                              {selectedCommObj && effectiveCommPct !== selectedCommObj.commission_percent && (
                                <span className="text-violet-400 ml-1">· ajustado</span>
                              )})
                            </span>
                            <span className="text-rose-400 font-medium">−{formatCurrency(salePreview.commission)}</span>
                          </div>
                        )}

                        <div className="border-t border-slate-700/60 pt-2 flex justify-between">
                          <span className="text-sm font-semibold text-white">Ganancia neta</span>
                          <span className={`text-lg font-bold ${
                            salePreview.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {formatCurrency(salePreview.netProfit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 pb-6">
                  <button
                    onClick={closeSaleModal}
                    className="flex-1 btn-secondary py-2.5 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRegisterSale}
                    disabled={
                      modalState === 'saving' ||
                      !selectedProduct ||
                      (saleType === 'commissioner' && !selectedCommissioner) ||
                      !salePreview?.stockOk
                    }
                    className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/50 disabled:text-amber-700 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {modalState === 'saving' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      'Confirmar Venta'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ Modal: Reponer Stock ══ */}
      {editingAlertProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-700/60 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/50">
              <h3 className="text-lg font-bold text-white">Reponer Stock</h3>
              <button
                onClick={() => setEditingAlertProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Producto</p>
                <p className="text-white font-semibold text-lg">{editingAlertProduct.name}</p>
                <p className="text-slate-500 text-sm">Stock actual: <span className="text-amber-400 font-bold">{editingAlertProduct.stock_current}</span></p>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
                  Unidades a agregar
                </label>
                <input
                  type="number"
                  value={replenishQty}
                  onChange={e => setReplenishQty(e.target.value)}
                  className="input"
                  placeholder="Ej: 10"
                  min="1"
                  autoFocus
                />
              </div>

              {replenishQty && parseInt(replenishQty) > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 animate-fade-in">
                  <p className="text-sm text-emerald-400">
                    Nuevo stock: <span className="font-bold text-lg">{editingAlertProduct.stock_current + parseInt(replenishQty)}</span> unidades
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEditingAlertProduct(null)} className="flex-1 btn-secondary py-2.5 rounded-xl">
                Cancelar
              </button>
              <button
                onClick={handleReplenish}
                disabled={replenishSaving || !replenishQty || parseInt(replenishQty) <= 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                {replenishSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
