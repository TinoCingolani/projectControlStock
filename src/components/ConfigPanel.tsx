import { useState, useEffect } from 'react';
import { Settings, DollarSign, Percent, Package } from 'lucide-react';
import type { Config } from '../types';
import { formatCurrency } from '../utils/calculations';

interface ConfigPanelProps {
  config: Config | null;
  updateConfig: (updates: Partial<Config>) => Promise<boolean>;
}

export function ConfigPanel({ config, updateConfig }: ConfigPanelProps) {
  const [dolarArs, setDolarArs] = useState('');
  const [margenMinimo, setMargenMinimo] = useState('');
  const [alertaStockBajo, setAlertaStockBajo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setDolarArs(config.dolar_ars.toString());
      setMargenMinimo(config.margen_minimo.toString());
      setAlertaStockBajo(config.alerta_stock_bajo.toString());
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    await updateConfig({
      dolar_ars: parseFloat(dolarArs) || 1490,
      margen_minimo: parseFloat(margenMinimo) || 30,
      alerta_stock_bajo: parseInt(alertaStockBajo) || 3,
    });
    setSaving(false);
  };

  if (!config) return null;

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Configuración General</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <label className="text-sm text-slate-400">Valor Dólar (ARS)</label>
          </div>
          <input
            type="number"
            value={dolarArs}
            onChange={(e) => setDolarArs(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            step="0.01"
          />
          <p className="text-xs text-slate-500 mt-1">Actualiza todos los costos</p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-4 h-4 text-amber-400" />
            <label className="text-sm text-slate-400">Margen Mínimo (%)</label>
          </div>
          <input
            type="number"
            value={margenMinimo}
            onChange={(e) => setMargenMinimo(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            step="0.1"
          />
          <p className="text-xs text-slate-500 mt-1">Referencia de rendimiento</p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-rose-400" />
            <label className="text-sm text-slate-400">Alerta Stock Bajo</label>
          </div>
          <input
            type="number"
            value={alertaStockBajo}
            onChange={(e) => setAlertaStockBajo(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
          />
          <p className="text-xs text-slate-500 mt-1">Unidades mínimas</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Dólar actual: <span className="text-cyan-400 font-medium">{formatCurrency(config.dolar_ars)}</span>
        </p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
