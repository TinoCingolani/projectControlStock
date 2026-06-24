import { AlertTriangle, PackageX, RefreshCw, TrendingDown } from 'lucide-react';
import type { ProductWithCalculated, Config } from '../types';
import { isLowStock } from '../utils/calculations';

interface AlertsPanelProps {
  products: ProductWithCalculated[];
  config: Config | null;
  onEditProduct?: (product: ProductWithCalculated) => void;
}

export function AlertsPanel({ products, config, onEditProduct }: AlertsPanelProps) {
  if (!config) return null;

  const noStock  = products.filter(p => p.stock_current <= 0);
  const lowStock = products.filter(p => p.stock_current > 0 && isLowStock(p.stock_current, config.alerta_stock_bajo));
  const total    = noStock.length + lowStock.length;

  if (total === 0) return null;

  return (
    <div className="animate-fade-in mb-6">
      {/* Panel header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-bold uppercase tracking-[0.12em]">
            Alertas de Reposición
          </span>
        </div>
        <span className="bg-amber-500/15 text-amber-300 border border-amber-400/25
                         text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
          {total}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Sin stock primero (crítico) */}
        {noStock.map(p => (
          <AlertCard
            key={p.id}
            product={p}
            severity="critical"
            onEdit={onEditProduct}
          />
        ))}
        {/* Stock bajo */}
        {lowStock.map(p => (
          <AlertCard
            key={p.id}
            product={p}
            severity="low"
            threshold={config.alerta_stock_bajo}
            onEdit={onEditProduct}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Card individual ── */
interface AlertCardProps {
  product: ProductWithCalculated;
  severity: 'critical' | 'low';
  threshold?: number;
  onEdit?: (product: ProductWithCalculated) => void;
}

function AlertCard({ product, severity, threshold, onEdit }: AlertCardProps) {
  const isCritical = severity === 'critical';

  return (
    <div
      className={`
        relative overflow-hidden rounded-3xl border p-4
        backdrop-blur-xl transition-all duration-300
        ${isCritical
          ? 'bg-rose-500/8 border-rose-400/25 animate-pulse-glow-red hover:border-rose-400/40 hover:bg-rose-500/12'
          : 'bg-amber-500/7 border-amber-400/22 animate-pulse-glow-amber hover:border-amber-400/35 hover:bg-amber-500/10'
        }
      `}
    >
      {/* Borde lateral luminoso */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${
          isCritical ? 'bg-rose-400' : 'bg-amber-400'
        } shadow-[0_0_8px_${isCritical ? 'rgba(244,63,94,0.8)' : 'rgba(245,158,11,0.8)'}]`}
      />

      {/* Glow corner decorativo */}
      <div className={`pointer-events-none absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl
                       ${isCritical ? 'bg-rose-500/15' : 'bg-amber-500/12'}`} />

      <div className="pl-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {isCritical
              ? <PackageX className="w-4 h-4 text-rose-400 shrink-0" />
              : <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
            }
            <p className="text-sm font-bold text-white truncate tracking-tight">
              {product.name}
            </p>
          </div>

          {isCritical
            ? <span className="badge-critical shrink-0">Sin stock</span>
            : <span className="badge-low shrink-0">Stock bajo</span>
          }
        </div>

        {/* Stock info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-white/35 font-semibold uppercase tracking-wider mb-0.5">
              Stock actual
            </p>
            <p className={`text-2xl font-extrabold tabular-nums tracking-tight
                           ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
              {product.stock_current}
              {threshold !== undefined && (
                <span className="text-xs text-white/30 font-normal ml-1">
                  / mín {threshold}
                </span>
              )}
            </p>
          </div>

          {onEdit && (
            <button
              onClick={() => onEdit(product)}
              title="Actualizar stock"
              className={`
                flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-2xl
                transition-all duration-200 active:scale-95 backdrop-blur-sm
                ${isCritical
                  ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-400/25'
                  : 'bg-amber-500/12 text-amber-300 hover:bg-amber-500/22 border border-amber-400/22'
                }
              `}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reponer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
