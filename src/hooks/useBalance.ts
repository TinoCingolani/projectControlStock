import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const CONFIG_ROW_ID  = 1;
const INIT_BALANCE   = 13_000;

interface UseBalanceReturn {
  balance: number;
  loading: boolean;
  /** Suma un monto al saldo (llamado al confirmar una venta). */
  addToBalance: (amount: number) => Promise<boolean>;
  /** Ajusta el saldo por un delta firmado (positivo = ingreso, negativo = gasto). */
  adjustBalance: (delta: number) => Promise<boolean>;
  /** Sobreescribe el saldo con un valor exacto. */
  setBalance: (value: number) => Promise<boolean>;
}

/**
 * Persiste el saldo de "Dinero en Cuenta Actual" en Supabase (tabla config, fila id=1).
 * Inicializa en $13.000 si no existe el valor.
 */
export function useBalance(): UseBalanceReturn {
  const [balance, setBalanceState] = useState<number>(INIT_BALANCE);
  const [loading, setLoading]      = useState<boolean>(true);

  // ─── Carga inicial desde Supabase ────────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("config")
      .select("dinero_cuenta")
      .eq("id", CONFIG_ROW_ID)
      .single();

    if (error) {
      console.error("[useBalance] Error al cargar saldo:", error.message);
    } else if (data?.dinero_cuenta != null) {
      setBalanceState(Number(data.dinero_cuenta));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // ─── Persistencia central ─────────────────────────────────────────────────
  /**
   * Escribe el nuevo saldo en Supabase y actualiza el estado local.
   * Devuelve `true` si tuvo éxito.
   */
  const persist = useCallback(async (newValue: number): Promise<boolean> => {
    const { error } = await supabase
      .from("config")
      .update({ dinero_cuenta: newValue })
      .eq("id", CONFIG_ROW_ID);

    if (error) {
      console.error("[useBalance] Error al guardar saldo:", error.message);
      return false;
    }

    setBalanceState(newValue);
    return true;
  }, []);

  // ─── API pública ──────────────────────────────────────────────────────────
  const addToBalance = useCallback(
    async (amount: number): Promise<boolean> => {
      // Leemos el valor más reciente antes de sumar para evitar race conditions
      const { data, error } = await supabase
        .from("config")
        .select("dinero_cuenta")
        .eq("id", CONFIG_ROW_ID)
        .single();

      if (error || data?.dinero_cuenta == null) {
        console.error("[useBalance] Error al releer saldo antes de sumar:", error?.message);
        return false;
      }

      const next = Number(data.dinero_cuenta) + amount;
      return persist(next);
    },
    [persist],
  );

  const adjustBalance = useCallback(
    async (delta: number): Promise<boolean> => {
      const { data, error } = await supabase
        .from("config")
        .select("dinero_cuenta")
        .eq("id", CONFIG_ROW_ID)
        .single();

      if (error || data?.dinero_cuenta == null) {
        console.error("[useBalance] Error al releer saldo antes de ajustar:", error?.message);
        return false;
      }

      const next = Number(data.dinero_cuenta) + delta;
      return persist(next);
    },
    [persist],
  );

  const setBalance = useCallback(
    async (value: number): Promise<boolean> => persist(value),
    [persist],
  );

  return { balance, loading, addToBalance, adjustBalance, setBalance };
}
