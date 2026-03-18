'use client';

/**
 * useColumnNavigation
 *
 * A generic, type-safe hook for managing the URL state of a Miller Columns
 * (progressive disclosure) layout. Uses nuqs `useQueryStates` so that all
 * column selections are batched into a single URL history entry — browser
 * back/forward works correctly even when multiple params change at once.
 *
 * All params are nullable strings: null means "not selected / not open".
 * When a param is null it is removed from the URL entirely (clean URLs).
 *
 * Generic type K:
 *   The union of all param key names managed by this navigation instance.
 *   Inferred automatically from the `keys` array when you use `as const`.
 *
 * ─── Basic Usage ────────────────────────────────────────────────────────────
 *
 *   const nav = useColumnNavigation(['clientId', 'ruleId'] as const);
 *
 *   nav.values.clientId   // string | null
 *   nav.values.ruleId     // string | null
 *
 *   // Select a client, atomically clear any open rule → one history entry
 *   nav.set({ clientId: id, ruleId: null });
 *
 *   // Open a specific rule
 *   nav.set({ ruleId: ruleId });
 *
 *   // Close everything (collapse all panels)
 *   nav.clearAll();
 *
 * ─── Options ────────────────────────────────────────────────────────────────
 *
 *   historyMode: 'push' (default) | 'replace'
 *     'push'    — each selection is a separate browser history entry (back works)
 *     'replace' — selections update the URL in-place (no back entries created)
 *                 use 'replace' for transient UI state like hover previews
 *
 * ─── Using on a New Page ────────────────────────────────────────────────────
 *
 *   Pick your param names and pass them as a const array:
 *
 *   // Fahrer (drivers) page
 *   const nav = useColumnNavigation(['driverId', 'vehicleId'] as const);
 *
 *   // Fahrzeuge (vehicles) page
 *   const nav = useColumnNavigation(['vehicleId', 'inspectionId'] as const);
 *
 *   The param names appear directly in the URL:
 *   /dashboard/drivers?driverId=abc-123&vehicleId=xyz-456
 *
 *   Ensure each page uses unique param names to avoid collisions if multiple
 *   column views are ever mounted simultaneously.
 *
 * ─── Important: Avoid recreating `keys` on every render ─────────────────────
 *
 *   Always declare your keys array outside the component or use `as const`
 *   inline. The hook memoizes the parsers object from the keys, but if the
 *   keys reference itself changes identity on every render you will get
 *   unnecessary re-renders.
 *
 *   ✅  const nav = useColumnNavigation(['clientId', 'ruleId'] as const);
 *   ✅  const KEYS = ['clientId', 'ruleId'] as const;
 *       const nav = useColumnNavigation(KEYS);
 *   ⚠️  const nav = useColumnNavigation(['clientId', 'ruleId']); // infers string[]
 *
 * ─── Relation to the Panel System ───────────────────────────────────────────
 *
 *   This hook is the state layer for src/components/panels/.
 *   The panel components are pure UI; this hook owns the "which panel is open"
 *   logic. Keep them separate for testability and reuse.
 */

import { useMemo } from 'react';
import { parseAsString, useQueryStates } from 'nuqs';

type NullableStringRecord<K extends string> = Record<K, string | null>;

interface UseColumnNavigationOptions {
  /** Default: 'push' — each selection adds a browser history entry */
  historyMode?: 'push' | 'replace';
}

interface UseColumnNavigationReturn<K extends string> {
  /** Current values of all managed URL params. null = absent from URL. */
  values: NullableStringRecord<K>;
  /**
   * Batch-update one or more params in a single URL history entry.
   * Pass null for any key to remove it from the URL.
   *
   * @example
   * nav.set({ clientId: id, ruleId: null }); // select client, close rule
   * nav.set({ ruleId: 'new' });              // open new-rule panel
   */
  set: (updates: Partial<NullableStringRecord<K>>) => void;
  /**
   * Remove specific params from the URL (set to null).
   *
   * @example
   * nav.clear('ruleId');           // close rule panel
   * nav.clear('clientId', 'ruleId'); // close both panels
   */
  clear: (...keys: K[]) => void;
  /** Remove all managed params from the URL. Collapses all panels. */
  clearAll: () => void;
}

function useColumnNavigation<K extends string>(
  keys: readonly K[],
  options?: UseColumnNavigationOptions
): UseColumnNavigationReturn<K> {
  const historyMode = options?.historyMode ?? 'push';

  // Memoize parsers to avoid recreating them on every render.
  // parseAsString yields `string | null` — null when the param is absent.
  const parsers = useMemo(
    () =>
      Object.fromEntries(keys.map((k) => [k, parseAsString])) as Record<
        K,
        typeof parseAsString
      >,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // keys is expected to be a stable `as const` array reference.
    [keys.join(',')]
  );

  const [values, setValues] = useQueryStates(parsers, {
    history: historyMode
  });

  const set = (updates: Partial<NullableStringRecord<K>>) => {
    void setValues(updates as Parameters<typeof setValues>[0]);
  };

  const clear = (...clearKeys: K[]) => {
    const nullUpdates = Object.fromEntries(clearKeys.map((k) => [k, null]));
    void setValues(nullUpdates as Parameters<typeof setValues>[0]);
  };

  const clearAll = () => {
    const nullUpdates = Object.fromEntries(keys.map((k) => [k, null]));
    void setValues(nullUpdates as Parameters<typeof setValues>[0]);
  };

  return {
    values: values as NullableStringRecord<K>,
    set,
    clear,
    clearAll
  };
}

export { useColumnNavigation };
export type { UseColumnNavigationOptions, UseColumnNavigationReturn };
