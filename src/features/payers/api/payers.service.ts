import { createClient } from '@/lib/supabase/client';
import type {
  BillingType,
  BillingTypeBehavior,
  Payer,
  PayerWithBillingCount
} from '../types/payer.types';

export const DEFAULT_BEHAVIOR: BillingTypeBehavior = {
  returnPolicy: 'none',
  lockReturnMode: false,
  lockPickup: false,
  lockDropoff: false,
  prefillDropoffFromPickup: false,
  requirePassenger: true,
  defaultPickup: null,
  defaultDropoff: null,
  defaultPickupStreet: null,
  defaultPickupStreetNumber: null,
  defaultPickupZip: null,
  defaultPickupCity: null,
  defaultDropoffStreet: null,
  defaultDropoffStreetNumber: null,
  defaultDropoffZip: null,
  defaultDropoffCity: null
};

export class PayersService {
  static async getPayers(): Promise<PayerWithBillingCount[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('payers')
      .select('id, name, number, billing_types(count)')
      .order('name');

    if (error) {
      console.error('Error fetching payers:', error);
      throw error;
    }

    return (data || []) as PayerWithBillingCount[];
  }

  static async createPayer(
    companyId: string,
    name: string,
    number: string
  ): Promise<void> {
    if (!companyId) throw new Error('Company ID is required');

    const supabase = createClient();
    const { error } = await supabase.from('payers').insert({
      company_id: companyId,
      name,
      number
    });

    if (error) {
      console.error('Error creating payer:', error);
      throw error;
    }
  }

  static async updatePayer(
    id: string,
    name: string,
    number: string
  ): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('payers')
      .update({ name, number })
      .eq('id', id);

    if (error) {
      console.error('Error updating payer:', error);
      throw error;
    }
  }

  static async getBillingTypes(payerId: string): Promise<BillingType[]> {
    if (!payerId) return [];

    const supabase = createClient();
    const { data, error } = await supabase
      .from('billing_types')
      .select('*')
      .eq('payer_id', payerId)
      .order('name');

    if (error) {
      console.error('Error fetching billing types:', error);
      throw error;
    }

    return (data || []) as BillingType[];
  }

  static async createBillingType(
    payerId: string,
    name: string,
    color: string
  ): Promise<void> {
    if (!payerId) throw new Error('Payer ID is required');

    const supabase = createClient();
    const { error } = await supabase.from('billing_types').insert({
      payer_id: payerId,
      name,
      color,
      behavior_profile: DEFAULT_BEHAVIOR as any // Cast to any to bypass strict JSON type for now
    });

    if (error) {
      console.error('Error creating billing type:', error);
      throw error;
    }
  }

  static async deleteBillingType(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('billing_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting billing type:', error);
      throw error;
    }
  }

  static async updateBillingTypeBehavior(
    id: string,
    behavior: BillingTypeBehavior
  ): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('billing_types')
      .update({ behavior_profile: behavior as any }) // Cast to any to bypass strict JSON type for now
      .eq('id', id);

    if (error) {
      console.error('Error updating billing type behavior:', error);
      throw error;
    }
  }
}
