/**
 * Kanban localStorage helper for the Taxigo admin app.
 *
 * Centralized keys and helpers for Kanban-related localStorage usage:
 * pending changes, column order, etc. Provides typed get/set/remove,
 * SSR-safe access, and a Zustand persist storage adapter.
 */

import { createJSONStorage } from 'zustand/middleware';

/** All localStorage keys used by the Kanban board. Add new keys here. */
export const STORAGE_KEYS = {
  /** Kanban pending changes (assignments, grouping, time); staged until Speichern. */
  KANBAN_PENDING: 'taxigo-kanban-pending',
  /** Kanban column order per group-by mode (driver, status, payer). */
  KANBAN_COLUMN_ORDER: 'taxigo-kanban-column-order'
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Check if we're in a browser (SSR-safe). */
function isAvailable(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

/**
 * Get a JSON-serializable value from localStorage.
 * Returns undefined if key is missing, invalid JSON, or storage is unavailable.
 */
export function getItem<T>(key: StorageKey): T | undefined {
  if (!isAvailable()) return undefined;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/**
 * Set a JSON-serializable value in localStorage.
 * No-op if storage is unavailable or quota exceeded.
 */
export function setItem<T>(key: StorageKey, value: T): void {
  if (!isAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded, private mode, etc.
  }
}

/**
 * Remove a key from localStorage.
 */
export function removeItem(key: StorageKey): void {
  if (!isAvailable()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * Low-level storage (string in/out) for Zustand persist.
 * createJSONStorage wraps this to produce a PersistStorage (StorageValue in/out).
 */
function getStateStorage() {
  return {
    getItem: (name: string): string | null => {
      if (!isAvailable()) return null;
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: string): void => {
      if (!isAvailable()) return;
      try {
        localStorage.setItem(name, value);
      } catch {
        // Ignore
      }
    },
    removeItem: (name: string): void => {
      if (!isAvailable()) return;
      try {
        localStorage.removeItem(name);
      } catch {
        // Ignore
      }
    }
  };
}

/**
 * Storage adapter for Zustand persist middleware.
 * createJSONStorage converts our string-based storage to the StorageValue
 * format (parsed { state, version }) that persist expects.
 */
export const localStorageAdapter = createJSONStorage(getStateStorage);
