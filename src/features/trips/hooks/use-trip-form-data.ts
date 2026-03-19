'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface PayerOption {
  id: string;
  name: string;
}

export interface BillingTypeOption {
  id: string;
  name: string;
  color: string;
  payer_id: string;
  behavior_profile?: any;
}

export interface ClientOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  is_company: boolean;
  phone: string | null;
  street: string;
  street_number: string;
  zip_code: string;
  city: string;
}

export interface DriverOption {
  id: string;
  name: string;
}

export function useTripFormData(payerId?: string | null) {
  const [payers, setPayers] = useState<PayerOption[]>([]);
  const [billingTypes, setBillingTypes] = useState<BillingTypeOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const [payersRes, driversRes] = await Promise.all([
          supabase.from('payers').select('id, name').order('name'),
          supabase
            .from('accounts')
            .select('id, name')
            .eq('role', 'driver')
            .eq('is_active', true)
            .order('name')
        ]);
        if (payersRes.data) setPayers(payersRes.data);
        if (driversRes.data) setDrivers(driversRes.data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    // 'all' is the URL sentinel for “every payer”, not a real UUID — never query eq('payer_id', 'all').
    if (!payerId || payerId === 'all') {
      setBillingTypes([]);
      return;
    }
    const fetchBillingTypes = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('billing_types')
        .select('id, name, color, payer_id, behavior_profile')
        .eq('payer_id', payerId)
        .order('name');
      if (data) setBillingTypes(data);
    };
    fetchBillingTypes();
  }, [payerId]);

  const searchClients = async (query: string): Promise<ClientOption[]> => {
    if (!query || query.length < 2) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from('clients')
      .select(
        'id, first_name, last_name, company_name, is_company, phone, street, street_number, zip_code, city'
      )
      .or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,company_name.ilike.%${query}%`
      )
      .limit(8);
    return data || [];
  };

  const searchClientsByFirstName = async (
    query: string
  ): Promise<ClientOption[]> => {
    if (!query || query.length < 2) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from('clients')
      .select(
        'id, first_name, last_name, company_name, is_company, phone, street, street_number, zip_code, city'
      )
      .or(`first_name.ilike.%${query}%,company_name.ilike.%${query}%`)
      .order('first_name')
      .limit(8);
    return data || [];
  };

  const searchClientsByLastName = async (
    query: string
  ): Promise<ClientOption[]> => {
    if (!query || query.length < 2) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from('clients')
      .select(
        'id, first_name, last_name, company_name, is_company, phone, street, street_number, zip_code, city'
      )
      .or(`last_name.ilike.%${query}%,company_name.ilike.%${query}%`)
      .order('last_name')
      .limit(8);
    return data || [];
  };

  const searchClientsById = async (
    id: string
  ): Promise<ClientOption | null> => {
    if (!id) return null;
    const supabase = createClient();
    const { data } = await supabase
      .from('clients')
      .select(
        'id, first_name, last_name, company_name, is_company, phone, street, street_number, zip_code, city'
      )
      .eq('id', id)
      .single();
    return (data as ClientOption) || null;
  };

  return {
    payers,
    billingTypes,
    drivers,
    isLoading,
    searchClients,
    searchClientsByFirstName,
    searchClientsByLastName,
    searchClientsById
  };
}
