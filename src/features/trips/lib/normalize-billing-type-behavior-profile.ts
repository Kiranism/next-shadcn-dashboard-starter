/**
 * Single source of truth for reading `billing_types.behavior_profile` (JSON)
 * in trip flows. Matches `billing-type-behavior-dialog` / bulk-upload semantics.
 */

export interface NormalizedBillingTypeBehavior {
  returnPolicy: 'none' | 'time_tbd' | 'exact' | null;
  lockPickup: boolean;
  lockDropoff: boolean;
  lockReturnMode: boolean;
  prefillDropoffFromPickup: boolean;
  requirePassenger: boolean;
}

/**
 * Flattens DB/API quirks: JSON string, nested `behavior` / `profile`, etc.
 */
export function parseBehaviorProfileRaw(raw: unknown): Record<string, unknown> {
  if (raw == null || raw === '') return {};

  let v: unknown = raw;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v) as unknown;
    } catch {
      return {};
    }
  }

  if (typeof v !== 'object' || v === null || Array.isArray(v)) {
    return {};
  }

  let o = v as Record<string, unknown>;

  // Nested shapes seen in the wild / future API versions
  const inner =
    (typeof o.behavior === 'object' &&
      o.behavior !== null &&
      !Array.isArray(o.behavior) &&
      (o.behavior as Record<string, unknown>)) ||
    (typeof o.profile === 'object' &&
      o.profile !== null &&
      !Array.isArray(o.profile) &&
      (o.profile as Record<string, unknown>)) ||
    undefined;

  if (inner) {
    o = inner;
  }

  return o;
}

/**
 * Same rules as `normaliseBehavior` in `billing-type-behavior-dialog.tsx`.
 */
export function normalizeBillingTypeBehavior(
  raw: unknown
): NormalizedBillingTypeBehavior {
  const b = parseBehaviorProfileRaw(raw);

  const rawPolicy = (b.returnPolicy ?? b.return_policy ?? null) as
    | string
    | null;

  let requirePassenger: boolean;
  if (b.requirePassenger !== undefined) {
    requirePassenger = !!b.requirePassenger;
  } else if (b.require_passenger !== undefined) {
    requirePassenger = !!b.require_passenger;
  } else {
    // Legacy: same defaults as `billing-type-behavior-dialog` `normaliseBehavior`
    const legacyPassenger =
      b.showPickupPassenger ?? b.show_pickup_passenger ?? true;
    const legacyDropoffPassenger =
      b.showDropoffPassenger ?? b.show_dropoff_passenger ?? true;
    requirePassenger = !!(legacyPassenger && legacyDropoffPassenger);
  }

  return {
    returnPolicy: rawPolicy as NormalizedBillingTypeBehavior['returnPolicy'],
    lockPickup: !!(b.lockPickup ?? b.lock_pickup ?? false),
    lockDropoff: !!(b.lockDropoff ?? b.lock_dropoff ?? false),
    lockReturnMode: !!(b.lockReturnMode ?? b.lock_return_mode ?? false),
    prefillDropoffFromPickup: !!(
      b.prefillDropoffFromPickup ??
      b.prefill_dropoff_from_pickup ??
      false
    ),
    requirePassenger
  };
}
