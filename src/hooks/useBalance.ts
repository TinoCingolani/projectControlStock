import { useState, useCallback } from "react";

const STORAGE_KEY  = "cuenta_saldo_v1";
const INIT_BALANCE = 13_000;

/**
 * Persists the current cash balance in localStorage.
 * Initializes at $13.000 if no stored value exists.
 */
export function useBalance() {
  const [balance, setBalanceState] = useState<number>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? parseFloat(stored) : INIT_BALANCE;
  });

  const persist = (value: number) => {
    localStorage.setItem(STORAGE_KEY, value.toString());
  };

  /** Adds an amount to the balance (called on sale confirmation). */
  const addToBalance = useCallback((amount: number) => {
    setBalanceState(prev => {
      const next = prev + amount;
      persist(next);
      return next;
    });
  }, []);

  /** Adjusts the balance by a signed delta (positive = income, negative = expense). */
  const adjustBalance = useCallback((delta: number) => {
    setBalanceState(prev => {
      const next = prev + delta;
      persist(next);
      return next;
    });
  }, []);

  /** Overwrites the balance with a specific value. */
  const setBalance = useCallback((value: number) => {
    persist(value);
    setBalanceState(value);
  }, []);

  return { balance, addToBalance, adjustBalance, setBalance };
}
