export interface BillingTypeBehavior {
  returnPolicy: 'none' | 'create_placeholder' | 'create_on_demand';
  lockPickup: boolean;
  lockDropoff: boolean;
  prefillDropoffFromPickup: boolean;
  showPickupPassenger: boolean;
  showDropoffPassenger: boolean;
  defaultPickup?: string | null;
  defaultDropoff?: string | null;
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
