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

  const noStock   = products.filter(p => p.stock_current <= 0);
  const lowStock  = products.filter(p => p.stock_current > 0 && isLowStock(p.stock_current, config.alerta_stock_bajo));
  const total     = noStock.length + lowStock.length;

  if (total === 0) return null;

  return (
    <div className="animate-fade-in mb-6">
      {/* Panel header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-semibold uppercase tracking-wider">
            Alertas de Reposición
          </span>
        </div>
        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
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
        relative rounded-xl border p-4 transition-all duration-200
        ${isCritical
          ? 'bg-rose-950/30 border-rose-500/30 animate-pulse-glow-red'
          : 'bg-amber-950/20 border-amber-500/25 animate-pulse-glow-amber'
        }
      `}
    >
      {/* Severity stripe */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
          isCritical ? 'bg-rose-500' : 'bg-amber-500'
        }`}
      />

      <div className="pl-2">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {isCritical
              ? <PackageX className="w-4 h-4 text-rose-400 shrink-0" />
              : <TrendingDown className="w-4 h-4 text-amber-400 shrink-0" />
            }
            <p className="text-sm font-semibold text-white truncate">{product.name}</p>
          </div>

          {isCritical
            ? <span className="badge-critical shrink-0">Sin stock</span>
            : <span className="badge-low shrink-0">Stock bajo</span>
          }
        </div>

        {/* Stock info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Stock actual</p>
            <p className={`text-2xl font-bold tabular-nums ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
              {product.stock_current}
              {threshold !== undefined && (
                <span className="text-xs text-slate-500 font-normal ml-1">/ mín {threshold}</span>
              )}
            </p>
          </div>

          {onEdit && (
            <button
              onClick={() => onEdit(product)}
              title="Actualizar stock"
              className={`
                flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                transition-all duration-150 active:scale-95
                ${isCritical
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/25'
                }
              `}
            >
              <RefreshCw className="w-3 h-3" />
              Reponer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
