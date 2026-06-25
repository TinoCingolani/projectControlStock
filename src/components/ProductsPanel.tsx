import { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Pencil, Trash2, X, TrendingDown, AlertTriangle, Search } from 'lucide-react';
import type { ProductWithCalculated, Config } from '../types';
import { formatCurrency, formatPercent, isMarginLow, isLowStock } from '../utils/calculations';

interface ProductsPanelProps {
  products: ProductWithCalculated[];
  config: Config | null;
  addProduct: (product: Omit<ProductWithCalculated, 'id' | 'units_sold' | 'created_at' | 'updated_at' | 'cost_ars' | 'profit_per_unit' | 'total_profit_potential' | 'margin_percent' | 'stock_current'>) => Promise<boolean>;
  updateProduct: (id: string, updates: Partial<ProductWithCalculated>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
}

type CostCurrency = 'USD' | 'ARS';

export function ProductsPanel({ products, config, addProduct, updateProduct, deleteProduct }: ProductsPanelProps) {
  const [showModal, setShowModal]         = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCalculated | null>(null);
  const [name, setName]                   = useState('');
  const [quantity, setQuantity]           = useState('');
  const [costInput, setCostInput]         = useState('');   // valor ingresado (USD o ARS según costCurrency)
  const [costCurrency, setCostCurrency]   = useState<CostCurrency>('USD');
  const [priceArs, setPriceArs]           = useState('');
  const [saving, setSaving]               = useState(false);
  const [searchQuery, setSearchQuery]     = useState('');

  /* ── Filtro ── */
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, searchQuery]);

  /* ── Derivados del modal: cost_usd efectivo ── */
  const derivedCostUsd = useMemo(() => {
    const raw = parseFloat(costInput) || 0;
    if (!raw || !config) return 0;
    return costCurrency === 'USD' ? raw : raw / config.dolar_ars;
  }, [costInput, costCurrency, config]);

  const derivedCostArs = useMemo(() => {
    if (!config) return 0;
    return derivedCostUsd * config.dolar_ars;
  }, [derivedCostUsd, config]);

  const handleSubmit = async () => {
    if (!name.trim() || !quantity || !costInput || !priceArs) return;
    setSaving(true);
    const productData = {
      name:          name.trim(),
      quantity:      parseInt(quantity) || 0,
      cost_usd:      derivedCostUsd,
      price_ars:     parseFloat(priceArs) || 0,
      stock_initial: parseInt(quantity) || 0,
    };
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData);
    } else {
      await addProduct(productData);
    }
    setSaving(false);
    closeModal();
  };

  const handleEdit = (product: ProductWithCalculated) => {
    setEditingProduct(product);
    setName(product.name);
    setQuantity(product.quantity.toString());
    setCostInput(product.cost_usd.toString());
    setCostCurrency('USD');
    setPriceArs(product.price_ars.toString());
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await deleteProduct(id);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setName('');
    setQuantity('');
    setCostInput('');
    setCostCurrency('USD');
    setPriceArs('');
  };

  const previewMargin = config && derivedCostArs > 0
    ? (parseFloat(priceArs) || 0) > 0
      ? (((parseFloat(priceArs) || 0) - derivedCostArs) / (parseFloat(priceArs) || 1)) * 100
      : 0
    : null;

  return (
    <div className="card animate-fade-in">
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
          </div>
          <span>Control de Pedidos / Compras</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-900/30 hover:shadow-emerald-700/40 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nuevo Pedido
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

      {/* Estado vacío */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <ShoppingCart className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No hay pedidos registrados</p>
          <p className="text-sm mt-1 text-slate-600">Creá tu primer pedido con el botón de arriba</p>
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
                  <th className="text-center py-3 px-3 bg-slate-900/40">Cant.</th>
                  <th className="text-right py-3 px-3 bg-slate-900/40">Costo USD</th>
                  <th className="text-right py-3 px-3 bg-slate-900/40">Costo ARS</th>
                  <th className="text-right py-3 px-3 bg-slate-900/40">Precio Venta</th>
                  <th className="text-right py-3 px-3 bg-slate-900/40">Gcia/Unidad</th>
                  <th className="text-right py-3 px-3 bg-slate-900/40">Margen %</th>
                  <th className="text-center py-3 px-4 bg-slate-900/40 rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const marginBelowMin = config && isMarginLow(p.margin_percent, config.margen_minimo);
                  const lowStock       = config && isLowStock(p.stock_current, config.alerta_stock_bajo);
                  const noStock        = p.stock_current <= 0;

                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-700/30 transition-colors hover:bg-slate-700/20 ${
                        noStock ? 'row-no-stock' : lowStock ? 'row-low-stock' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-white">{p.name}</p>
                        {noStock && (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-400 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Sin stock
                          </span>
                        )}
                        {!noStock && lowStock && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Stock bajo
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`font-bold text-base tabular-nums ${
                          noStock ? 'text-rose-400' : lowStock ? 'text-amber-400' : 'text-white'
                        }`}>{p.quantity}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right text-slate-400">{formatCurrency(p.cost_usd, 'USD')}</td>
                      <td className="py-3.5 px-3 text-right text-slate-300">{formatCurrency(p.cost_ars)}</td>
                      <td className="py-3.5 px-3 text-right font-semibold text-white">{formatCurrency(p.price_ars)}</td>
                      <td className="py-3.5 px-3 text-right text-emerald-400 font-medium">{formatCurrency(p.profit_per_unit)}</td>
                      <td className={`py-3.5 px-3 text-right font-semibold ${marginBelowMin ? 'text-rose-400' : 'text-cyan-400'}`}>
                        <div className="flex items-center justify-end gap-1">
                          {marginBelowMin && <TrendingDown className="w-3.5 h-3.5" />}
                          {formatPercent(p.margin_percent)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
              const marginBelowMin = config && isMarginLow(p.margin_percent, config.margen_minimo);
              const lowStock       = config && isLowStock(p.stock_current, config.alerta_stock_bajo);
              const noStock        = p.stock_current <= 0;

              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 ${
                    noStock
                      ? 'bg-rose-950/20 border-rose-500/25'
                      : lowStock
                      ? 'bg-amber-950/20 border-amber-500/20'
                      : 'bg-slate-900/40 border-slate-700/40'
                  }`}
                >
                  {/* Top */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Stock: <span className={`font-bold ${
                        noStock ? 'text-rose-400' : lowStock ? 'text-amber-400' : 'text-white'
                      }`}>{p.stock_current}</span></p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(p)} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Grid de métricas */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-800/60 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Costo USD</p>
                      <p className="font-medium text-slate-300">{formatCurrency(p.cost_usd, 'USD')}</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Costo ARS</p>
                      <p className="font-medium text-slate-300">{formatCurrency(p.cost_ars)}</p>
                    </div>
                    <div className="bg-slate-800/60 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Precio Venta</p>
                      <p className="font-semibold text-white">{formatCurrency(p.price_ars)}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${marginBelowMin ? 'bg-rose-900/20' : 'bg-slate-800/60'}`}>
                      <p className="text-xs text-slate-500">Margen</p>
                      <p className={`font-semibold flex items-center gap-1 ${marginBelowMin ? 'text-rose-400' : 'text-cyan-400'}`}>
                        {marginBelowMin && <TrendingDown className="w-3 h-3" />}
                        {formatPercent(p.margin_percent)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-700/40 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Ganancia por unidad</span>
                    <span className="text-emerald-400 font-semibold text-sm">{formatCurrency(p.profit_per_unit)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ══ Modal ══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700/60 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? 'Editar Pedido' : 'Nuevo Pedido'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Nombre del Producto</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input"
                  placeholder="Ej: Vaper SMOK Nord 5"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Cantidad</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="input"
                  min="1"
                  placeholder="0"
                />
              </div>

              {/* ── Campo de costo con toggle de moneda ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-400 font-medium uppercase tracking-wide">Costo</label>
                  {/* Toggle USD / ARS */}
                  <div className="flex items-center bg-slate-900/70 rounded-lg p-0.5 border border-slate-700/50">
                    <button
                      type="button"
                      onClick={() => setCostCurrency('USD')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-200 ${
                        costCurrency === 'USD'
                          ? 'bg-cyan-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      USD
                    </button>
                    <button
                      type="button"
                      onClick={() => setCostCurrency('ARS')}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-200 ${
                        costCurrency === 'ARS'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      ARS
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold pointer-events-none">
                    {costCurrency === 'USD' ? 'U$D' : '$'}
                  </span>
                  <input
                    type="number"
                    value={costInput}
                    onChange={e => setCostInput(e.target.value)}
                    className="input pl-10"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Precio de Venta ARS</label>
                <input
                  type="number"
                  value={priceArs}
                  onChange={e => setPriceArs(e.target.value)}
                  className="input"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              {/* Preview live */}
              {config && derivedCostUsd > 0 && (
                <div className="col-span-2 grid grid-cols-2 gap-3 animate-fade-in">
                  {/* Costo en la moneda opuesta */}
                  <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3">
                    {costCurrency === 'USD' ? (
                      <>
                        <p className="text-xs text-slate-500 mb-1">Equivalente en ARS</p>
                        <p className="text-white font-semibold">{formatCurrency(derivedCostArs)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-slate-500 mb-1">Equivalente en USD</p>
                        <p className="text-white font-semibold">{formatCurrency(derivedCostUsd, 'USD')}</p>
                      </>
                    )}
                  </div>
                  {previewMargin !== null && (
                    <div className={`rounded-xl p-3 border ${
                      isMarginLow(previewMargin, config.margen_minimo)
                        ? 'bg-rose-900/20 border-rose-500/30'
                        : 'bg-slate-900/60 border-slate-700/40'
                    }`}>
                      <p className="text-xs text-slate-500 mb-1">Margen estimado</p>
                      <p className={`font-semibold ${
                        isMarginLow(previewMargin, config.margen_minimo) ? 'text-rose-400' : 'text-cyan-400'
                      }`}>
                        {formatPercent(previewMargin)}
                        {isMarginLow(previewMargin, config.margen_minimo) && (
                          <span className="text-xs ml-1 opacity-70">← bajo mínimo</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 btn-secondary py-2.5 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !name.trim() || !quantity || !costInput || !priceArs}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:text-emerald-700 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {saving ? 'Guardando...' : 'Guardar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
