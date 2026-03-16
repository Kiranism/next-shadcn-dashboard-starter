export interface BillingTypeBehavior {
  returnPolicy: 'none' | 'time_tbd' | 'exact';
  lockReturnMode: boolean;
  lockPickup: boolean;
  lockDropoff: boolean;
  prefillDropoffFromPickup: boolean;
  requirePassenger: boolean;
  // Legacy single-string defaults (kept for backward compatibility)
  defaultPickup?: string | null;
  defaultDropoff?: string | null;
  // Structured defaults for better prefilling
  defaultPickupStreet?: string | null;
  defaultPickupStreetNumber?: string | null;
  defaultPickupZip?: string | null;
  defaultPickupCity?: string | null;
  defaultDropoffStreet?: string | null;
  defaultDropoffStreetNumber?: string | null;
  defaultDropoffZip?: string | null;
  defaultDropoffCity?: string | null;
}

export interface BillingType {
  id: string;
  payer_id: string;
  name: string;
  color: string;
  behavior_profile: BillingTypeBehavior;
  created_at: string;
}

export interface Payer {
  id: string;
  company_id: string;
  name: string;
  number: string;
  created_at: string;
}

export interface PayerWithBillingCount extends Payer {
  billing_types: { count: number }[];
}
