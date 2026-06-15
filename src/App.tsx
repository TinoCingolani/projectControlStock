import { useState } from 'react';
import { LayoutDashboard, Settings, ShoppingCart, Package, Users, History, Menu, X, AlertTriangle, Zap } from 'lucide-react';
import { useConfig, useCommissioners, useProducts, useSales, useDashboardStats } from './hooks/useData';
import { useBalance } from './hooks/useBalance';
import { Dashboard } from './components/Dashboard';
import { ConfigPanel } from './components/ConfigPanel';
import { CommissionerPanel } from './components/CommissionerPanel';
import { ProductsPanel } from './components/ProductsPanel';
import { SalesPanel } from './components/SalesPanel';
import { SalesHistory } from './components/SalesHistory';
import { isLowStock } from './utils/calculations';

type Tab = 'dashboard' | 'config' | 'orders' | 'stock' | 'commissioners' | 'history';

function App() {
  const [activeTab, setActiveTab]     = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { config, updateConfig }                                                     = useConfig();
  const { commissioners, addCommissioner, updateCommissioner, deleteCommissioner }   = useCommissioners();
  const { products, groupedProducts, addProduct, updateProduct, deleteProduct, loading: productsLoading } = useProducts(config);
  const { sales, addSale: addSaleRaw, deleteSale, loading: salesLoading }            = useSales();
  const stats = useDashboardStats(groupedProducts, sales, config);
  const { balance, loading: balanceLoading, addToBalance, adjustBalance }           = useBalance();

  /* Envuelve addSale para acreditar el monto al saldo cuando la venta se confirma */
  const addSale: typeof addSaleRaw = async (sale) => {
    const ok = await addSaleRaw(sale);
    if (ok) await addToBalance(sale.sale_price);
    return ok;
  };

  /* Badge de alertas de stock */
  const stockAlertCount = config
    ? groupedProducts.filter(p => p.stock_current <= 0 || isLowStock(p.stock_current, config.alerta_stock_bajo)).length
    : 0;

  const tabs = [
    { id: 'dashboard'    as Tab, label: 'Dashboard',       icon: LayoutDashboard },
    { id: 'orders'       as Tab, label: 'Pedidos',         icon: ShoppingCart },
    { id: 'stock'        as Tab, label: 'Stock y Ventas',  icon: Package,  alert: stockAlertCount },
    { id: 'commissioners'as Tab, label: 'Comisionistas',   icon: Users },
    { id: 'history'      as Tab, label: 'Historial',       icon: History },
    { id: 'config'       as Tab, label: 'Configuración',   icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            stats={stats}
            config={config}
            commissioners={commissioners}
            groupedProducts={groupedProducts}
            balance={balance}
            balanceLoading={balanceLoading}
            adjustBalance={adjustBalance}
          />
        );
      case 'config':
        return <ConfigPanel config={config} updateConfig={updateConfig} />;
      case 'orders':
        return (
          <ProductsPanel
            products={products}
            config={config}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
          />
        );
      case 'stock':
        return (
          <SalesPanel
            products={products}
            groupedProducts={groupedProducts}
            commissioners={commissioners}
            sales={sales}
            config={config}
            addSale={addSale}
            updateProduct={updateProduct}
          />
        );
      case 'commissioners':
        return (
          <CommissionerPanel
            commissioners={commissioners}
            addCommissioner={addCommissioner}
            updateCommissioner={updateCommissioner}
            deleteCommissioner={deleteCommissioner}
          />
        );
      case 'history':
        return (
          <SalesHistory
            sales={sales}
            products={products}
            commissioners={commissioners}
            deleteSale={deleteSale}
            updateProduct={updateProduct}
          />
        );
      default:
        return (
          <Dashboard
            stats={stats}
            config={config}
            commissioners={commissioners}
            groupedProducts={groupedProducts}
            balance={balance}
            balanceLoading={balanceLoading}
            adjustBalance={adjustBalance}
          />
        );
    }
  };

  const handleTabChange = (id: Tab) => {
    setActiveTab(id);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950">

      {/* ── Mobile header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/60 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-900/50">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold text-white">Vapers &amp; Electrónica</h1>
          </div>
          <div className="flex items-center gap-2">
            {stockAlertCount > 0 && (
              <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold px-2 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                {stockAlertCount}
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900/98 backdrop-blur-xl border-r border-slate-700/60 transition-transform duration-300 ease-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-900/50">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Vapers &amp; Electrónica</h1>
              <p className="text-xs text-slate-500">Gestión de Marketplace</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={isActive ? 'nav-item-active' : 'nav-item-inactive'}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.alert != null && tab.alert > 0 && (
                  <span className="alert-dot">{tab.alert}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick stats */}
        <div className="p-4 border-t border-slate-700/60">
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wider mb-3">Resumen rápido</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-slate-500">Dólar ARS</span>
              <span className="text-xs text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-full">
                ${config?.dolar_ars.toLocaleString('es-AR') || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-slate-500">Productos</span>
              <span className="text-xs text-white font-semibold">{groupedProducts.length}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-slate-500">Ventas</span>
              <span className="text-xs text-white font-semibold">{sales.length}</span>
            </div>
            {stockAlertCount > 0 && (
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-amber-500/80 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Alertas
                </span>
                <span className="text-xs text-amber-400 font-semibold">{stockAlertCount}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">

          {/* Page header */}
          <header className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {stockAlertCount > 0 && activeTab === 'stock' && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      {stockAlertCount} alerta{stockAlertCount > 1 ? 's' : ''} de stock
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Gestión completa de tu negocio de Marketplace
                </p>
              </div>

              {/* Profit chips */}
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-emerald-900/60 to-emerald-950/80 border border-emerald-700/30 rounded-xl px-4 py-2.5 shadow-lg shadow-emerald-950/50 hover:border-emerald-600/50 transition-all duration-200">
                  <p className="text-xs text-emerald-600 font-medium">Gcia. Realizada</p>
                  <p className="text-base font-bold text-emerald-400 tabular-nums">
                    ${stats.totalRealizedProfit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-cyan-900/60 to-cyan-950/80 border border-cyan-700/30 rounded-xl px-4 py-2.5 shadow-lg shadow-cyan-950/50 hover:border-cyan-600/50 transition-all duration-200">
                  <p className="text-xs text-cyan-600 font-medium">Gcia. Potencial</p>
                  <p className="text-base font-bold text-cyan-400 tabular-nums">
                    ${stats.totalPotentialProfit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          {productsLoading || salesLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-slate-500 text-sm animate-pulse">Cargando datos...</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              {renderContent()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
