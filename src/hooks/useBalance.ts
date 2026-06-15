import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

const CONFIG_ROW_ID = 1;
const INIT_BALANCE  = 13_000;

interface UseBalanceReturn {
  balance: number;
  loading: boolean;
  error: string | null;
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
 *
 * Usa un ref interno para tener siempre el último valor sin depender de closures
 * estáticas — evita tanto el stale-state bug como el SELECT extra antes de cada UPDATE.
 */
export function useBalance(): UseBalanceReturn {
  const [balance, setBalanceState] = useState<number>(INIT_BALANCE);
  const [loading, setLoading]      = useState<boolean>(true);
  const [error, setError]          = useState<string | null>(null);

  // Ref que siempre apunta al valor más reciente para que los callbacks
  // no necesiten capturar `balance` en su closure.
  const balanceRef = useRef<number>(INIT_BALANCE);

  const syncRef = (value: number) => {
    balanceRef.current = value;
    setBalanceState(value);
  };

  // ─── Carga inicial desde Supabase ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchErr } = await supabase
          .from("config")
          .select("dinero_cuenta")
          .eq("id", CONFIG_ROW_ID)
          .single();

        if (cancelled) return;

        if (fetchErr) {
          console.error("[useBalance] Error al cargar saldo:", fetchErr.message);
          setError(fetchErr.message);
        } else if (data?.dinero_cuenta != null) {
          syncRef(Number(data.dinero_cuenta));
        }
      } catch (err: any) {
        if (cancelled) return;
        console.error("[useBalance] Error inesperado al cargar:", err);
        setError(err.message || String(err));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchBalance();
    return () => { cancelled = true; };
  }, []);

  // ─── Escritura centralizada en Supabase ───────────────────────────────────
  const persist = useCallback(async (newValue: number): Promise<boolean> => {
    try {
      const { error: updateErr } = await supabase
        .from("config")
        .update({ dinero_cuenta: newValue })
        .eq("id", CONFIG_ROW_ID);

      if (updateErr) {
        console.error("[useBalance] Error al guardar saldo:", updateErr.message);
        setError(updateErr.message);
        return false;
      }

      setError(null);
      syncRef(newValue);
      return true;
    } catch (err: any) {
      console.error("[useBalance] Error inesperado al guardar:", err);
      setError(err.message || String(err));
      return false;
    }
  }, []);

  // ─── API pública ──────────────────────────────────────────────────────────
  const addToBalance = useCallback(
    (amount: number): Promise<boolean> => persist(balanceRef.current + amount),
    [persist],
  );

  const adjustBalance = useCallback(
    (delta: number): Promise<boolean> => persist(balanceRef.current + delta),
    [persist],
  );

  const setBalance = useCallback(
    (value: number): Promise<boolean> => persist(value),
    [persist],
  );

  return { balance, loading, error, addToBalance, adjustBalance, setBalance };
}


