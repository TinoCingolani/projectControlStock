import { useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, Package, AlertTriangle, ShoppingCart,
  Users, PieChart as PieChartIcon, TrendingDown, Wallet, BarChart3,
  Banknote, MinusCircle, PlusCircle, Check, X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { DashboardStats, Config, Commissioner, ProductWithCalculated } from "../types";
import { formatCurrency, formatPercent, calculateProjection } from "../utils/calculations";

interface DashboardProps {
  stats: DashboardStats;
  config: Config | null;
  commissioners: Commissioner[];
  groupedProducts: ProductWithCalculated[];
  balance: number;
  /** Verdadero mientras se carga el saldo desde Supabase por primera vez. */
  balanceLoading: boolean;
  /** Mensaje de error de Supabase, o null si no hay error. */
  balanceError: string | null;
  adjustBalance: (delta: number) => Promise<boolean>;
}

export function Dashboard({ stats, config, commissioners, groupedProducts, balance, balanceLoading, balanceError, adjustBalance }: DashboardProps) {
  /* ── Selector de comisionista para el peor caso ── */
  const [worstCaseCommId, setWorstCaseCommId] = useState<string>(commissioners[0]?.id ?? "");

  const worstCaseComm = useMemo(
    () => commissioners.find(c => c.id === worstCaseCommId) ?? commissioners[0] ?? null,
    [commissioners, worstCaseCommId],
  );

  /* ── Proyeccion financiera ── */
  const projection = useMemo(
    () => calculateProjection(groupedProducts, worstCaseComm),
    [groupedProducts, worstCaseComm],
  );

  /* ── Estado del formulario de ajuste de saldo ── */
  const [showAdjust, setShowAdjust]   = useState(false);
  const [adjustAmt, setAdjustAmt]     = useState("");
  const [adjustType, setAdjustType]   = useState<"gasto" | "ingreso">("gasto");
  const [adjustDesc, setAdjustDesc]   = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const handleAdjust = async () => {
    const amt = parseFloat(adjustAmt);
    if (!amt || isNaN(amt) || amt <= 0) return;
    setIsSaving(true);
    const ok = await adjustBalance(adjustType === "gasto" ? -amt : amt);
    setIsSaving(false);
    if (!ok) return; // el error ya se loguea en el hook
    setAdjustAmt("");
    setAdjustDesc("");
    setShowAdjust(false);
  };

  const cancelAdjust = () => {
    setShowAdjust(false);
    setAdjustAmt("");
    setAdjustDesc("");
    setAdjustType("gasto");
  };

  const pieData = [
    { name: "Ventas Directas", value: stats.directSales, color: "#06b6d4" },
    { name: "Ventas Comisionistas", value: stats.commissionerSales, color: "#a855f7" },
  ].filter(d => d.value > 0);

  const profitabilityPercent = stats.totalPotentialProfit > 0
    ? (stats.totalRealizedProfit / stats.totalPotentialProfit) * 100
    : 0;

  return (
    <div className="space-y-6">

      {/* ══ Stat chips rapidos ══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 opacity-80" />
            <span className="text-xs uppercase tracking-wider opacity-70">Realizadas</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalRealizedProfit)}</p>
          <p className="text-xs opacity-70 mt-1">Ganancias netas</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-6 h-6 opacity-80" />
            <span className="text-xs uppercase tracking-wider opacity-70">Futuras</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalFutureProfit)}</p>
          <p className="text-xs opacity-70 mt-1">En stock disponible</p>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-6 h-6 opacity-80" />
            <span className="text-xs uppercase tracking-wider opacity-70">Potencial</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalPotentialProfit)}</p>
          <p className="text-xs opacity-70 mt-1">{formatPercent(profitabilityPercent)} realizado</p>
        </div>

        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-5 text-white border border-slate-600">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 opacity-80" />
            <span className="text-xs uppercase tracking-wider opacity-70">Dolar</span>
          </div>
          <p className="text-2xl font-bold">{config ? formatCurrency(config.dolar_ars) : "-"}</p>
          <p className="text-xs opacity-70 mt-1">Tipo de cambio</p>
        </div>
      </div>

      {/* ══ Panel glassmorphism: Proyeccion + Saldo ══ */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/90 via-slate-800/70 to-slate-900/90 backdrop-blur-xl shadow-2xl p-6">
        {/* Glow decorativo */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-violet-500/8 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl" />

        {/* Header del panel */}
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Proyeccion Financiera del Stock</h3>
              <p className="text-xs text-slate-500">Basado en el inventario actual disponible</p>
            </div>
          </div>

          {/* Selector comisionista peor caso */}
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2">
            <Users className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-xs text-slate-400 whitespace-nowrap">Peor caso:</span>
            {commissioners.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Sin comisionistas</span>
            ) : (
              <select
                value={worstCaseCommId}
                onChange={e => setWorstCaseCommId(e.target.value)}
                className="bg-transparent text-xs text-rose-300 font-medium focus:outline-none cursor-pointer"
              >
                {commissioners.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-800 text-white">
                    {c.name} ({c.commission_percent}%)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Grid 4 metricas */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          {/* 1 — Costo Total */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 hover:border-slate-600/70 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Costo Total Acumulado</span>
              </div>
              <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">Inversion</span>
            </div>
            <p className="text-2xl font-bold text-rose-400 tabular-nums">{formatCurrency(projection.totalCost)}</p>
            <p className="text-xs text-slate-500 mt-1">Lo que invertiste en el stock actual</p>
          </div>

          {/* 2 — Venta Potencial */}
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 hover:border-slate-600/70 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Venta Total Potencial</span>
              </div>
              <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">Bruto</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400 tabular-nums">{formatCurrency(projection.totalRevenue)}</p>
            <p className="text-xs text-slate-500 mt-1">Si vendes todo al precio de lista</p>
          </div>

          {/* 3 — Ganancia Minima */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 hover:border-amber-500/35 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-xs font-medium text-amber-400/80 uppercase tracking-wide">Ganancia Minima</span>
              </div>
              <span className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Peor caso</span>
            </div>
            <p className="text-2xl font-bold text-amber-400 tabular-nums">{formatCurrency(projection.minProfit)}</p>
            <p className="text-xs text-amber-600/70 mt-1">
              Si todo lo vende <span className="font-semibold text-amber-500">{projection.commissionerName}</span> ({projection.commissionPercent}% comision)
            </p>
          </div>

          {/* 4 — Ganancia Maxima */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 hover:border-emerald-500/35 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-emerald-400/80 uppercase tracking-wide">Ganancia Maxima</span>
              </div>
              <span className="text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Mejor caso</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400 tabular-nums">{formatCurrency(projection.maxProfit)}</p>
            <p className="text-xs text-emerald-600/70 mt-1">Si vendes todo <span className="font-semibold text-emerald-500">vos directamente</span></p>
          </div>
        </div>

        {/* Barra de rango */}
        {projection.maxProfit > 0 && (
          <div className="relative mb-6 pt-4 border-t border-slate-700/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Rango de ganancias posibles</span>
              <span className="text-xs text-slate-400 font-medium">
                Diferencia: <span className="text-white">{formatCurrency(projection.maxProfit - projection.minProfit)}</span>
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-slate-700/60 overflow-hidden">
              <div className="absolute left-0 top-0 h-full w-full rounded-full bg-gradient-to-r from-amber-500/60 via-emerald-500/40 to-emerald-400/70" />
              <div
                className="absolute left-0 top-0 h-full rounded-l-full bg-gradient-to-r from-amber-500 to-amber-400"
                style={{ width: `${Math.max(5, (projection.minProfit / projection.maxProfit) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-amber-500">Min: {formatCurrency(projection.minProfit)}</span>
              <span className="text-xs text-emerald-500">Max: {formatCurrency(projection.maxProfit)}</span>
            </div>
          </div>
        )}

        {/* ══ 5a tarjeta: Dinero en Cuenta Actual ══ */}
        <div className="relative overflow-hidden rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-900/40 via-emerald-900/30 to-slate-900/50 p-5">
          {/* Glow interno */}
          <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-teal-400/10 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Info del saldo */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-teal-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-teal-400 uppercase tracking-wide">Dinero en Cuenta Actual</p>
                  <p className="text-xs text-slate-500">Se actualiza automáticamente con cada venta</p>
                </div>
              </div>

              <p className={`text-4xl font-bold tabular-nums tracking-tight transition-opacity duration-300 ${
                balanceLoading ? "opacity-30 animate-pulse" : ""
              } ${balance >= 0 ? "text-teal-300" : "text-rose-400"}`}>
                {balanceLoading ? "Cargando..." : formatCurrency(balance)}
              </p>
            </div>

            {/* Boton Ajustar saldo */}
            {!showAdjust && (
              <button
                onClick={() => setShowAdjust(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 border border-slate-600/60 bg-slate-800/60 hover:border-teal-500/50 hover:text-teal-300 hover:bg-teal-500/10 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap self-start sm:self-auto"
              >
                <MinusCircle className="w-3.5 h-3.5" />
                Ajustar saldo
              </button>
            )}
          </div>

          {/* Error de Supabase */}
          {balanceError && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-rose-400">Error al guardar en Supabase</p>
                <p className="text-xs text-rose-400/70 mt-0.5 font-mono">{balanceError}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Verificá que la migración <span className="text-slate-400 font-mono">002_add_dinero_cuenta.sql</span> esté aplicada en tu proyecto de Supabase.
                </p>
              </div>
            </div>
          )}




          {showAdjust && (
            <div className="relative mt-4 pt-4 border-t border-teal-500/20 animate-fade-in">
              <p className="text-xs text-slate-400 mb-3 font-medium">Registrar movimiento manual:</p>

              {/* Tipo de movimiento */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setAdjustType("gasto")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all duration-200 ${
                    adjustType === "gasto"
                      ? "bg-rose-500/20 border-rose-500/50 text-rose-300"
                      : "bg-slate-900/50 border-slate-600/50 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  Gasto / Egreso
                </button>
                <button
                  onClick={() => setAdjustType("ingreso")}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all duration-200 ${
                    adjustType === "ingreso"
                      ? "bg-teal-500/20 border-teal-500/50 text-teal-300"
                      : "bg-slate-900/50 border-slate-600/50 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Ingreso Extra
                </button>
              </div>

              {/* Campos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    value={adjustAmt}
                    onChange={e => setAdjustAmt(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="any"
                    className="input pl-8 text-sm"
                    autoFocus
                  />
                </div>
                <input
                  type="text"
                  value={adjustDesc}
                  onChange={e => setAdjustDesc(e.target.value)}
                  placeholder="Descripcion (opcional)"
                  className="input text-sm"
                />
              </div>

              {/* Preview del nuevo saldo */}
              {adjustAmt && parseFloat(adjustAmt) > 0 && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Saldo resultante:</span>
                  <span className={`text-sm font-bold tabular-nums ${
                    (balance + (adjustType === "gasto" ? -parseFloat(adjustAmt) : parseFloat(adjustAmt))) >= 0
                      ? "text-teal-300" : "text-rose-400"
                  }`}>
                    {formatCurrency(balance + (adjustType === "gasto" ? -parseFloat(adjustAmt) : parseFloat(adjustAmt)))}
                  </span>
                </div>
              )}

              {/* Botones de accion */}
              <div className="flex gap-2">
                <button
                  onClick={cancelAdjust}
                  className="flex items-center gap-1 flex-1 justify-center py-2 rounded-lg border border-slate-600/50 bg-slate-800/60 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all duration-200"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
                <button
                  onClick={handleAdjust}
                  disabled={!adjustAmt || parseFloat(adjustAmt) <= 0 || isSaving}
                  className={`flex items-center gap-1 flex-1 justify-center py-2 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                    adjustType === "gasto"
                      ? "bg-rose-600 hover:bg-rose-500 text-white"
                      : "bg-teal-600 hover:bg-teal-500 text-white"
                  }`}
                >
                  {isSaving ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {adjustType === "gasto" ? "Registrar Gasto" : "Agregar Ingreso"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ Fila inferior ══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <PieChartIcon className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Ventas por Canal</h3>
          </div>

          {pieData.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay ventas registradas</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }} itemStyle={{ color: "#fff" }} />
                  <Legend formatter={(value) => <span className="text-slate-300">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-slate-900/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-3 h-3 bg-cyan-500 rounded-full" />
              <div>
                <p className="text-sm text-slate-400">Ventas Directas</p>
                <p className="text-lg font-semibold text-white">{stats.directSales}</p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-3 h-3 bg-violet-500 rounded-full" />
              <div>
                <p className="text-sm text-slate-400">Comisionistas</p>
                <p className="text-lg font-semibold text-white">{stats.commissionerSales}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Resumen del Negocio</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
              <span className="text-slate-400">Total Productos</span>
              <span className="text-white font-semibold">{stats.totalProducts}</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
              <span className="text-slate-400">Total Ventas</span>
              <span className="text-white font-semibold">{stats.totalSales}</span>
            </div>
            <div className={`flex items-center justify-between rounded-lg p-3 ${stats.lowStockProducts > 0 ? "bg-amber-500/20" : "bg-slate-900/50"}`}>
              <span className={`flex items-center gap-2 ${stats.lowStockProducts > 0 ? "text-amber-400" : "text-slate-400"}`}>
                {stats.lowStockProducts > 0 && <AlertTriangle className="w-4 h-4" />}
                Productos con Stock Bajo
              </span>
              <span className={`font-semibold ${stats.lowStockProducts > 0 ? "text-amber-400" : "text-white"}`}>
                {stats.lowStockProducts}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Margen Minimo Configurado</span>
                <span className="text-cyan-400 font-semibold">
                  {config ? formatPercent(config.margen_minimo) : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
