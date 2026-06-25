import { useState, useMemo } from "react";
import {
  DollarSign, TrendingUp, Package, AlertTriangle, ShoppingCart,
  Users, PieChart as PieChartIcon, TrendingDown, Wallet, BarChart3,
  Banknote, MinusCircle, PlusCircle, Check, X,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { DashboardStats, Config, Commissioner, ProductWithCalculated } from "../types";
import { formatCurrency, formatPercent, calculateProjection } from "../utils/calculations";
import { Toast, useToast } from "./Toast";

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

/* ── Stat chip individual ── */
interface StatChipProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accentClass: string;    // color del texto del valor
  iconBgClass: string;    // bg del pill del icono
  iconColorClass: string; // color del icono
  glowHoverClass: string; // sombra en hover
}

function StatChip({ icon: Icon, label, value, sub, accentClass, iconBgClass, iconColorClass, glowHoverClass }: StatChipProps) {
  return (
    <div className={`glass-card p-5 group transition-all duration-300
                     hover:border-white/20 hover:-translate-y-1 ${glowHoverClass}`}>
      {/* Top row */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center
                         border border-white/15 ${iconBgClass}
                         shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]
                         group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-5 h-5 ${iconColorClass}`} />
        </div>
        <span className="text-[10px] text-white/35 font-semibold uppercase tracking-[0.14em]">
          {label}
        </span>
      </div>
      {/* Value */}
      <p className={`text-2xl font-extrabold tabular-nums tracking-tight ${accentClass}`}>
        {value}
      </p>
      <p className="text-xs text-white/35 mt-1 font-medium">{sub}</p>
    </div>
  );
}

export function Dashboard({
  stats, config, commissioners, groupedProducts,
  balance, balanceLoading, balanceError, adjustBalance,
}: DashboardProps) {

  /* ── Selector de comisionista para el peor caso ── */
  const [worstCaseCommId, setWorstCaseCommId] = useState<string>(commissioners[0]?.id ?? "");

  const worstCaseComm = useMemo(
    () => commissioners.find(c => c.id === worstCaseCommId) ?? commissioners[0] ?? null,
    [commissioners, worstCaseCommId],
  );

  /* ── Proyección financiera ── */
  const projection = useMemo(
    () => calculateProjection(groupedProducts, worstCaseComm),
    [groupedProducts, worstCaseComm],
  );

  /* ── Estado del formulario de ajuste de saldo ── */
  const [showAdjust, setShowAdjust]           = useState(false);
  const [adjustAmt, setAdjustAmt]             = useState("");
  const [adjustType, setAdjustType]           = useState<"gasto" | "ingreso">("gasto");
  const [adjustDesc, setAdjustDesc]           = useState("");
  const [isSaving, setIsSaving]               = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { toast, showToast, dismissToast }    = useToast();

  /** Paso 1: el usuario presiona el botón → abrimos el modal de confirmación */
  const requestAdjust = () => {
    const amt = parseFloat(adjustAmt);
    if (!amt || isNaN(amt) || amt <= 0) return;
    setShowConfirmModal(true);
  };

  /** Paso 2: el usuario confirma en el modal → ejecutamos en Supabase */
  const handleAdjust = async () => {
    const amt = parseFloat(adjustAmt);
    setShowConfirmModal(false);
    setIsSaving(true);
    const ok = await adjustBalance(adjustType === "gasto" ? -amt : amt);
    setIsSaving(false);
    if (ok) {
      showToast(
        adjustType === "gasto"
          ? `Gasto de ${formatCurrency(amt)} registrado`
          : `Ingreso de ${formatCurrency(amt)} registrado`,
        'success'
      );
      setAdjustAmt("");
      setAdjustDesc("");
      setShowAdjust(false);
    } else {
      showToast('Error al guardar el movimiento', 'error');
    }
  };

  const cancelAdjust = () => {
    setShowAdjust(false);
    setAdjustAmt("");
    setAdjustDesc("");
    setAdjustType("gasto");
  };

  const pieData = [
    { name: "Ventas Directas",      value: stats.directSales,      color: "#06b6d4" },
    { name: "Ventas Vendedores", value: stats.commissionerSales, color: "#a855f7" },
  ].filter(d => d.value > 0);

  const profitabilityPercent = stats.totalPotentialProfit > 0
    ? (stats.totalRealizedProfit / stats.totalPotentialProfit) * 100
    : 0;

  return (
    <div className="space-y-6">

      {/* ══ Stat chips — fila superior ══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatChip
          icon={TrendingUp}
          label="Realizadas"
          value={formatCurrency(stats.totalRealizedProfit)}
          sub="Ganancias netas"
          accentClass="text-emerald-400"
          iconBgClass="bg-emerald-500/15"
          iconColorClass="text-emerald-400"
          glowHoverClass="hover:shadow-[0_16px_48px_rgba(52,211,153,0.12),inset_0_1px_0_rgba(255,255,255,0.10)]"
        />
        <StatChip
          icon={Package}
          label="Futuras"
          value={formatCurrency(stats.totalFutureProfit)}
          sub="En stock disponible"
          accentClass="text-cyan-400"
          iconBgClass="bg-cyan-500/15"
          iconColorClass="text-cyan-400"
          glowHoverClass="hover:shadow-[0_16px_48px_rgba(6,182,212,0.12),inset_0_1px_0_rgba(255,255,255,0.10)]"
        />
        <StatChip
          icon={ShoppingCart}
          label="Potencial"
          value={formatCurrency(stats.totalPotentialProfit)}
          sub={`${formatPercent(profitabilityPercent)} realizado`}
          accentClass="text-violet-400"
          iconBgClass="bg-violet-500/15"
          iconColorClass="text-violet-400"
          glowHoverClass="hover:shadow-[0_16px_48px_rgba(139,92,246,0.12),inset_0_1px_0_rgba(255,255,255,0.10)]"
        />
        <StatChip
          icon={DollarSign}
          label="Dolar ARS"
          value={config ? formatCurrency(config.dolar_ars) : "—"}
          sub="Tipo de cambio"
          accentClass="text-amber-400"
          iconBgClass="bg-amber-500/15"
          iconColorClass="text-amber-400"
          glowHoverClass="hover:shadow-[0_16px_48px_rgba(245,158,11,0.12),inset_0_1px_0_rgba(255,255,255,0.10)]"
        />
      </div>

      {/* ══ Panel Proyección Financiera — Liquid Glass premium ══ */}
      <div className="glass-panel p-6">
        {/* Blobs internos decorativos */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80
                        rounded-full bg-cyan-500/6 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64
                        rounded-full bg-violet-500/6 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 right-1/3 w-56 h-56
                        rounded-full bg-emerald-500/4 blur-3xl" />

        {/* Header del panel */}
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl
                            bg-gradient-to-br from-cyan-500/20 to-violet-500/20
                            border border-white/15
                            shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]
                            flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight tracking-tight">
                Proyección Financiera del Stock
              </h3>
              <p className="text-xs text-white/35 font-medium">
                Basado en el inventario actual disponible
              </p>
            </div>
          </div>

          {/* Selector comisionista peor caso */}
          <div className="flex items-center gap-2
                          bg-white/5 border border-white/10 rounded-2xl px-3 py-2
                          backdrop-blur-sm">
            <Users className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-xs text-white/40 whitespace-nowrap">Peor caso:</span>
            {commissioners.length === 0 ? (
              <span className="text-xs text-white/30 italic">Sin vendedores</span>
            ) : (
              <select
                value={worstCaseCommId}
                onChange={e => setWorstCaseCommId(e.target.value)}
                className="bg-transparent text-xs text-rose-300 font-semibold
                           focus:outline-none cursor-pointer"
              >
                {commissioners.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name} ({c.commission_percent}%)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Grid 4 métricas */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          {/* 1 — Costo Total */}
          <div className="glass-inner group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/20
                                flex items-center justify-center
                                group-hover:bg-rose-500/22 transition-colors">
                  <Wallet className="w-4 h-4 text-rose-400" />
                </div>
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                  Costo Total Acumulado
                </span>
              </div>
              <span className="text-[10px] text-white/30 bg-white/5 border border-white/8
                               px-2 py-0.5 rounded-full font-medium">
                Inversión
              </span>
            </div>
            <p className="text-2xl font-extrabold text-rose-400 tabular-nums tracking-tight">
              {formatCurrency(projection.totalCost)}
            </p>
            <p className="text-xs text-white/30 mt-1">Lo que invertiste en el stock actual</p>
          </div>

          {/* 2 — Venta Potencial */}
          <div className="glass-inner group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/20
                                flex items-center justify-center
                                group-hover:bg-cyan-500/22 transition-colors">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                  Venta Total Potencial
                </span>
              </div>
              <span className="text-[10px] text-white/30 bg-white/5 border border-white/8
                               px-2 py-0.5 rounded-full font-medium">
                Bruto
              </span>
            </div>
            <p className="text-2xl font-extrabold text-cyan-400 tabular-nums tracking-tight">
              {formatCurrency(projection.totalRevenue)}
            </p>
            <p className="text-xs text-white/30 mt-1">Si vendés todo al precio de lista</p>
          </div>

          {/* 3 — Ganancia Mínima */}
          <div className="relative rounded-2xl border border-amber-500/20 p-4
                          bg-amber-500/5 backdrop-blur-sm
                          hover:border-amber-500/35 hover:bg-amber-500/8
                          transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/20
                                flex items-center justify-center
                                group-hover:bg-amber-500/22 transition-colors">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs font-semibold text-amber-400/70 uppercase tracking-wide">
                  Ganancia Mínima
                </span>
              </div>
              <span className="text-[10px] text-amber-400/60 bg-amber-500/10
                               border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                Peor caso
              </span>
            </div>
            <p className="text-2xl font-extrabold text-amber-400 tabular-nums tracking-tight">
              {formatCurrency(projection.minProfit)}
            </p>
            <p className="text-xs text-amber-500/50 mt-1">
              Si todo lo vende{" "}
              <span className="font-bold text-amber-400/80">{projection.commissionerName}</span>
              {" "}({projection.commissionPercent}% comisión)
            </p>
          </div>

          {/* 4 — Ganancia Máxima */}
          <div className="relative rounded-2xl border border-emerald-500/20 p-4
                          bg-emerald-500/5 backdrop-blur-sm
                          hover:border-emerald-500/35 hover:bg-emerald-500/8
                          transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/20
                                flex items-center justify-center
                                group-hover:bg-emerald-500/22 transition-colors">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-emerald-400/70 uppercase tracking-wide">
                  Ganancia Máxima
                </span>
              </div>
              <span className="text-[10px] text-emerald-400/60 bg-emerald-500/10
                               border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                Mejor caso
              </span>
            </div>
            <p className="text-2xl font-extrabold text-emerald-400 tabular-nums tracking-tight">
              {formatCurrency(projection.maxProfit)}
            </p>
            <p className="text-xs text-emerald-500/50 mt-1">
              Si vendés todo{" "}
              <span className="font-bold text-emerald-400/80">vos directamente</span>
            </p>
          </div>
        </div>

        {/* Barra de rango */}
        {projection.maxProfit > 0 && (
          <div className="relative mb-6 pt-4 border-t border-white/8">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs text-white/35 font-medium">Rango de ganancias posibles</span>
              <span className="text-xs text-white/45 font-medium">
                Diferencia:{" "}
                <span className="text-white font-bold">
                  {formatCurrency(projection.maxProfit - projection.minProfit)}
                </span>
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-white/8 overflow-hidden">
              {/* Track completo con gradiente suave */}
              <div className="absolute inset-0 rounded-full
                              bg-gradient-to-r from-amber-500/30 via-emerald-500/20 to-emerald-400/40" />
              {/* Barra de mínimo */}
              <div
                className="absolute left-0 top-0 h-full rounded-l-full
                            bg-gradient-to-r from-amber-500 to-amber-400
                            shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                style={{ width: `${Math.max(5, (projection.minProfit / projection.maxProfit) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-amber-400 font-semibold">
                Min: {formatCurrency(projection.minProfit)}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                Max: {formatCurrency(projection.maxProfit)}
              </span>
            </div>
          </div>
        )}

        {/* ══ Tarjeta Dinero en Cuenta ══ */}
        <div className="relative overflow-hidden rounded-2xl border border-teal-400/25
                        bg-gradient-to-br from-teal-500/8 via-emerald-500/5 to-transparent
                        backdrop-blur-sm p-5
                        shadow-[0_0_32px_rgba(20,184,166,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]">
          {/* Glow interno */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40
                          rounded-full bg-teal-400/10 blur-2xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Info del saldo */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-2xl
                                bg-teal-500/15 border border-teal-400/25
                                flex items-center justify-center
                                shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]">
                  <Banknote className="w-4.5 h-4.5 text-teal-300" />
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-400/80 uppercase tracking-[0.12em]">
                    Dinero en Cuenta Actual
                  </p>
                  <p className="text-xs text-white/30 font-medium">
                    Se actualiza automáticamente con cada venta
                  </p>
                </div>
              </div>

              <p className={`text-5xl font-extrabold tabular-nums tracking-tight
                             transition-opacity duration-300
                             ${balanceLoading ? "opacity-30 animate-pulse" : ""}
                             ${balance >= 0 ? "text-teal-300" : "text-rose-400"}`}>
                {balanceLoading ? "Cargando..." : formatCurrency(balance)}
              </p>
            </div>

            {/* Botón Ajustar saldo */}
            {!showAdjust && (
              <button
                onClick={() => setShowAdjust(true)}
                className="btn-glass self-start sm:self-auto whitespace-nowrap"
              >
                <MinusCircle className="w-3.5 h-3.5" />
                Ajustar saldo
              </button>
            )}
          </div>

          {/* Error de Supabase */}
          {balanceError && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl
                            border border-rose-500/25 bg-rose-500/8
                            backdrop-blur-sm px-4 py-3">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-rose-400">Error al guardar en Supabase</p>
                <p className="text-xs text-rose-400/60 mt-0.5 font-mono">{balanceError}</p>
                <p className="text-xs text-white/30 mt-1">
                  Verificá que la migración{" "}
                  <span className="text-white/50 font-mono">002_add_dinero_cuenta.sql</span>{" "}
                  esté aplicada en tu proyecto de Supabase.
                </p>
              </div>
            </div>
          )}

          {/* Formulario ajuste de saldo */}
          {showAdjust && (
            <div className="relative mt-5 pt-5 border-t border-white/8 animate-fade-in">
              <p className="text-xs text-white/45 mb-4 font-semibold">
                Registrar movimiento manual:
              </p>

              {/* Tipo de movimiento */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setAdjustType("gasto")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl
                              border text-xs font-semibold transition-all duration-200
                              ${adjustType === "gasto"
                                ? "bg-rose-500/18 border-rose-400/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                                : "bg-white/5 border-white/10 text-white/40 hover:border-white/18"
                              }`}
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  Gasto / Egreso
                </button>
                <button
                  onClick={() => setAdjustType("ingreso")}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl
                              border text-xs font-semibold transition-all duration-200
                              ${adjustType === "ingreso"
                                ? "bg-teal-500/18 border-teal-400/40 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.15)]"
                                : "bg-white/5 border-white/10 text-white/40 hover:border-white/18"
                              }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Ingreso Extra
                </button>
              </div>

              {/* Campos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                    $
                  </span>
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
                  placeholder="Descripción (opcional)"
                  className="input text-sm"
                />
              </div>

              {/* Preview nuevo saldo */}
              {adjustAmt && parseFloat(adjustAmt) > 0 && (
                <div className="mb-4 px-4 py-2.5 rounded-2xl
                                bg-white/5 border border-white/10
                                flex items-center justify-between">
                  <span className="text-xs text-white/40">Saldo resultante:</span>
                  <span className={`text-sm font-extrabold tabular-nums ${
                    (balance + (adjustType === "gasto" ? -parseFloat(adjustAmt) : parseFloat(adjustAmt))) >= 0
                      ? "text-teal-300" : "text-rose-400"
                  }`}>
                    {formatCurrency(
                      balance + (adjustType === "gasto" ? -parseFloat(adjustAmt) : parseFloat(adjustAmt))
                    )}
                  </span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-2">
                <button
                  onClick={cancelAdjust}
                  className="btn-glass flex-1 justify-center py-2.5"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
                <button
                  onClick={requestAdjust}
                  disabled={!adjustAmt || parseFloat(adjustAmt) <= 0 || isSaving}
                  className={`flex items-center justify-center gap-2 flex-1 py-2.5 rounded-2xl
                              text-xs font-bold transition-all duration-200
                              disabled:opacity-40 disabled:cursor-not-allowed
                              ${adjustType === "gasto"
                                ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:from-rose-500 hover:to-rose-600 shadow-[0_4px_16px_rgba(244,63,94,0.30)]"
                                : "bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 shadow-[0_4px_16px_rgba(20,184,166,0.30)]"
                              }`}
                >
                  {isSaving ? (
                    <span className="inline-block w-3.5 h-3.5
                                     border-2 border-white/40 border-t-white
                                     rounded-full animate-spin" />
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

      {/* ══ Fila inferior — Gráfico + Resumen ══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Ventas por Canal */}
        <div className="glass-card p-6 group">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/15 border border-cyan-500/20
                            flex items-center justify-center
                            group-hover:bg-cyan-500/22 transition-colors">
              <PieChartIcon className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Ventas por Canal</h3>
          </div>

          {pieData.length === 0 ? (
            <div className="text-center py-12 text-white/25">
              <PieChartIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No hay ventas registradas</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={72}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(3,6,15,0.9)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "16px",
                      backdropFilter: "blur(24px)",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend formatter={(value) => (
                    <span className="text-white/60 text-xs">{value}</span>
                  )} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="glass-inner flex items-center gap-3 !rounded-2xl">
              <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full
                              shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
              <div>
                <p className="text-xs text-white/40 font-medium">Directas</p>
                <p className="text-lg font-extrabold text-white">{stats.directSales}</p>
              </div>
            </div>
            <div className="glass-inner flex items-center gap-3 !rounded-2xl">
              <div className="w-2.5 h-2.5 bg-violet-400 rounded-full
                              shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
              <div>
                <p className="text-xs text-white/40 font-medium">Vendedores</p>
                <p className="text-lg font-extrabold text-white">{stats.commissionerSales}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen del Negocio */}
        <div className="glass-card p-6 group">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/20
                            flex items-center justify-center
                            group-hover:bg-amber-500/22 transition-colors">
              <Users className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Resumen del Negocio</h3>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between glass-inner !rounded-xl !py-3">
              <span className="text-sm text-white/50 font-medium">Total Productos</span>
              <span className="text-sm font-bold text-white">{stats.totalProducts}</span>
            </div>
            <div className="flex items-center justify-between glass-inner !rounded-xl !py-3">
              <span className="text-sm text-white/50 font-medium">Total Ventas</span>
              <span className="text-sm font-bold text-white">{stats.totalSales}</span>
            </div>
            <div className={`flex items-center justify-between !rounded-xl !py-3 px-4
                             backdrop-blur-sm border transition-all duration-200
                             ${stats.lowStockProducts > 0
                               ? "bg-amber-500/10 border-amber-400/20"
                               : "bg-white/4 border-white/8"
                             }`}>
              <span className={`flex items-center gap-2 text-sm font-medium
                                ${stats.lowStockProducts > 0 ? "text-amber-400" : "text-white/50"}`}>
                {stats.lowStockProducts > 0 && <AlertTriangle className="w-4 h-4" />}
                Productos con Stock Bajo
              </span>
              <span className={`text-sm font-bold
                                ${stats.lowStockProducts > 0 ? "text-amber-400" : "text-white"}`}>
                {stats.lowStockProducts}
              </span>
            </div>

            <div className="pt-3 mt-1 border-t border-white/8">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/45 font-medium">Margen Mínimo Configurado</span>
                <span className="text-sm font-bold text-cyan-400">
                  {config ? formatPercent(config.margen_minimo) : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Modal de Confirmación — Ajustar Saldo ══ */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm border border-slate-700/60 shadow-2xl animate-slide-up">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center
                             ${adjustType === 'gasto' ? 'bg-rose-500/15' : 'bg-teal-500/15'}`}>
              {adjustType === 'gasto'
                ? <MinusCircle className="w-6 h-6 text-rose-400" />
                : <PlusCircle  className="w-6 h-6 text-teal-400" />
              }
            </div>

            <h3 className="text-lg font-bold text-white text-center mb-1">
              ¿Confirmar movimiento?
            </h3>
            <p className="text-slate-400 text-sm text-center mb-5">
              Este cambio se guardará en la base de datos.
            </p>

            {/* Resumen */}
            <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tipo</span>
                <span className={`font-semibold capitalize ${adjustType === 'gasto' ? 'text-rose-400' : 'text-teal-400'}`}>
                  {adjustType === 'gasto' ? 'Gasto / Egreso' : 'Ingreso Extra'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Monto</span>
                <span className="font-bold text-white">{formatCurrency(parseFloat(adjustAmt) || 0)}</span>
              </div>
              {adjustDesc.trim() && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Descripción</span>
                  <span className="text-slate-300 text-right max-w-[60%]">{adjustDesc}</span>
                </div>
              )}
              <div className="border-t border-slate-700/50 pt-2 flex justify-between text-sm">
                <span className="text-slate-400">Saldo resultante</span>
                <span className={`font-extrabold tabular-nums ${
                  (balance + (adjustType === 'gasto' ? -(parseFloat(adjustAmt)||0) : (parseFloat(adjustAmt)||0))) >= 0
                    ? 'text-teal-300' : 'text-rose-400'
                }`}>
                  {formatCurrency(balance + (adjustType === 'gasto' ? -(parseFloat(adjustAmt)||0) : (parseFloat(adjustAmt)||0)))}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 btn-secondary py-2.5 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdjust}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white
                            transition-all duration-200 active:scale-95
                            flex items-center justify-center gap-2
                            ${adjustType === 'gasto'
                              ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600'
                              : 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600'
                            }`}
              >
                <Check className="w-4 h-4" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Toast ══ */}
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
