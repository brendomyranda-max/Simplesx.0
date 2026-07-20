/**
 * ============================================================
 * useLocalStorage.ts
 * ============================================================
 * PAPEL: Hook genérico para persistir estado React no localStorage.
 * QUEM USA: useRestaurantData (produtos, mesas, comandas, vendas, etc.).
 * O QUE FAZ:
 *   - Lê valor JSON da chave no mount (ou usa initialValue).
 *   - setValue atualiza state + localStorage de forma síncrona.
 *   - Aceita valor direto ou função updater (como useState).
 * FLUXO: mount → parse localStorage → state; setValue → state + setItem
 * ============================================================
 */

import { useState, useEffect } from 'react';

/**
 * Estado persistido em localStorage sob a chave `key`.
 * @param key - Nome da chave no localStorage
 * @param initialValue - Valor inicial se a chave não existir ou falhar o parse
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // ── Inicialização: tenta ler e parsear do localStorage ──
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /**
   * Atualiza o estado e grava no localStorage.
   * Suporta valor direto ou callback (prev => next).
   */
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
