import { useState } from 'react';
import {
  LayoutDashboard, Settings, ShoppingCart, Package, Users, History,
  Menu, X, AlertTriangle, Zap,
} from 'lucide-react';
import { useConfig, useCommissioners, useProducts, useSales, useDashboardStats } from './hooks/useData';
import { useBalance } from './hooks/useBalance';
import { Dashboard }          from './components/Dashboard';
import { ConfigPanel }        from './components/ConfigPanel';
import { CommissionerPanel }  from './components/CommissionerPanel';
import { ProductsPanel }      from './components/ProductsPanel';
import { SalesPanel }         from './components/SalesPanel';
import { SalesHistory }       from './components/SalesHistory';
import { isLowStock }         from './utils/calculations';

type Tab = 'dashboard' | 'config' | 'orders' | 'stock' | 'commissioners' | 'history';

function App() {
  const [activeTab, setActiveTab]     = useState<Tab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { config, updateConfig }                                                     = useConfig();
  const { commissioners, addCommissioner, updateCommissioner, deleteCommissioner }   = useCommissioners();
  const {
    products, groupedProducts, addProduct, updateProduct, deleteProduct,
    loading: productsLoading,
  } = useProducts(config);
  const { sales, addSale: addSaleRaw, deleteSale, loading: salesLoading } = useSales();
  const stats = useDashboardStats(groupedProducts, sales, config);
  const { balance, loading: balanceLoading, error: balanceError, addToBalance, adjustBalance } = useBalance();

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
    { id: 'dashboard'     as Tab, label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'orders'        as Tab, label: 'Pedidos',        icon: ShoppingCart },
    { id: 'stock'         as Tab, label: 'Stock y Ventas', icon: Package, alert: stockAlertCount },
    { id: 'commissioners' as Tab, label: 'Vendedores',  icon: Users },
    { id: 'history'       as Tab, label: 'Historial',      icon: History },
    { id: 'config'        as Tab, label: 'Configuración',  icon: Settings },
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
            balanceError={balanceError}
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
            balanceError={balanceError}
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
    <div className="min-h-screen">

      {/* ── Mobile header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40
                      bg-[#03060f]/80 backdrop-blur-[48px]
                      border-b border-white/8">
        <div className="flex items-center justify-between px-4 py-3.5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl
                            bg-gradient-to-br from-cyan-400 to-cyan-600
                            flex items-center justify-center
                            shadow-[0_0_16px_rgba(6,182,212,0.5)]">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              Vapers &amp; Electrónica
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {stockAlertCount > 0 && (
              <div className="flex items-center gap-1
                              bg-amber-500/15 border border-amber-400/30
                              text-amber-300 text-xs font-bold
                              px-2.5 py-1 rounded-full
                              backdrop-blur-sm">
                <AlertTriangle className="w-3 h-3" />
                {stockAlertCount}
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-white/50 hover:text-white
                         hover:bg-white/8 rounded-xl transition-all duration-200"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 flex flex-col
                    glass-sidebar transition-transform duration-300 ease-out
                    lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl
                            bg-gradient-to-br from-cyan-400 to-cyan-600
                            flex items-center justify-center
                            shadow-[0_0_24px_rgba(6,182,212,0.45)]
                            animate-glow-pulse">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight tracking-tight">
                Vapers &amp; Electrónica
              </h1>
              <p className="text-xs text-white/35 font-medium mt-0.5">
                Gestión de Marketplace
              </p>
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
        <div className="p-4 border-t border-white/8">
          <p className="text-[10px] text-white/25 font-semibold uppercase tracking-[0.15em] mb-3">
            Resumen rápido
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-3 py-2 rounded-xl
                            bg-white/4 border border-white/8">
              <span className="text-xs text-white/45">Dólar ARS</span>
              <span className="text-xs text-cyan-400 font-bold tabular-nums">
                ${config?.dolar_ars.toLocaleString('es-AR') || '—'}
              </span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 rounded-xl
                            bg-white/4 border border-white/8">
              <span className="text-xs text-white/45">Productos</span>
              <span className="text-xs text-white font-bold">{groupedProducts.length}</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 rounded-xl
                            bg-white/4 border border-white/8">
              <span className="text-xs text-white/45">Ventas</span>
              <span className="text-xs text-white font-bold">{sales.length}</span>
            </div>
            {stockAlertCount > 0 && (
              <div className="flex justify-between items-center px-3 py-2 rounded-xl
                              bg-amber-500/10 border border-amber-400/20">
                <span className="text-xs text-amber-300/80 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Alertas
                </span>
                <span className="text-xs text-amber-300 font-bold">{stockAlertCount}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-md"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-7 max-w-7xl mx-auto">

          {/* Page header */}
          <header className="mb-7">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                {stockAlertCount > 0 && activeTab === 'stock' && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-300
                                   bg-amber-500/12 border border-amber-400/25
                                   px-3 py-1 rounded-full font-medium backdrop-blur-sm mb-2">
                    <AlertTriangle className="w-3 h-3" />
                    {stockAlertCount} alerta{stockAlertCount > 1 ? 's' : ''} de stock
                  </span>
                )}
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-white/35 text-sm mt-1 font-medium">
                  Gestión completa de tu negocio de Marketplace
                </p>
              </div>

              {/* Profit chips — glass premium */}
              <div className="flex items-center gap-3">
                <div className="glass-card px-4 py-3 hover:border-emerald-400/25
                                hover:shadow-[0_8px_32px_rgba(52,211,153,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]
                                transition-all duration-300 rounded-2xl">
                  <p className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-[0.12em]">
                    Gcia. Realizada
                  </p>
                  <p className="text-base font-bold text-emerald-400 tabular-nums leading-tight">
                    ${stats.totalRealizedProfit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="glass-card px-4 py-3 hover:border-cyan-400/25
                                hover:shadow-[0_8px_32px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]
                                transition-all duration-300 rounded-2xl">
                  <p className="text-[10px] text-cyan-400/70 font-semibold uppercase tracking-[0.12em]">
                    Gcia. Potencial
                  </p>
                  <p className="text-base font-bold text-cyan-400 tabular-nums leading-tight">
                    ${stats.totalPotentialProfit.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          {productsLoading || salesLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-5">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full border border-cyan-400/30 border-b-transparent animate-spin"
                     style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="text-center">
                <p className="text-white/60 text-sm font-medium">Cargando datos</p>
                <p className="text-white/25 text-xs mt-1">Conectando con Supabase...</p>
              </div>
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
