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
  /** True if `billing-type-behavior-dialog` defines any default pickup fields (same test as create-trip). */
  hasDefaultPickupAddress: boolean;
  /** True if any default dropoff fields are defined. */
  hasDefaultDropoffAddress: boolean;
}

function hasBehaviorDefaultPickup(b: Record<string, unknown>): boolean {
  const defaultPickup = b.defaultPickup ?? b.default_pickup;
  const pickupStreet = b.defaultPickupStreet ?? b.default_pickup_street ?? null;
  const pickupStreetNumber =
    b.defaultPickupStreetNumber ?? b.default_pickup_street_number ?? null;
  const pickupZip = b.defaultPickupZip ?? b.default_pickup_zip ?? null;
  const pickupCity = b.defaultPickupCity ?? b.default_pickup_city ?? null;
  return !!(
    defaultPickup ||
    pickupStreet ||
    pickupStreetNumber ||
    pickupZip ||
    pickupCity
  );
}

function hasBehaviorDefaultDropoff(b: Record<string, unknown>): boolean {
  const defaultDropoff = b.defaultDropoff ?? b.default_dropoff;
  const dropoffStreet =
    b.defaultDropoffStreet ?? b.default_dropoff_street ?? null;
  const dropoffStreetNumber =
    b.defaultDropoffStreetNumber ?? b.default_dropoff_street_number ?? null;
  const dropoffZip = b.defaultDropoffZip ?? b.default_dropoff_zip ?? null;
  const dropoffCity = b.defaultDropoffCity ?? b.default_dropoff_city ?? null;
  return !!(
    defaultDropoff ||
    dropoffStreet ||
    dropoffStreetNumber ||
    dropoffZip ||
    dropoffCity
  );
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
    requirePassenger,
    hasDefaultPickupAddress: hasBehaviorDefaultPickup(b),
    hasDefaultDropoffAddress: hasBehaviorDefaultDropoff(b)
  };
}
