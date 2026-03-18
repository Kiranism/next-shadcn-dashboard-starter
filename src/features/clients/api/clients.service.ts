import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

export type Client = Database['public']['Tables']['clients']['Row'];
export type InsertClient = Database['public']['Tables']['clients']['Insert'];
export type UpdateClient = Database['public']['Tables']['clients']['Update'];

type GetClientsFilters = {
  page?: number;
  limit?: number;
  search?: string;
};

export const clientsService = {
  async getClients(filters?: GetClientsFilters) {
    const supabase = createClient();
    let query = supabase.from('clients').select('*', { count: 'exact' });

    if (filters?.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`
      );
    }

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    // Primary sort: last_name A-Z (nulls last = companies appear after persons).
    // Secondary sorts are applied client-side in client-list-panel.tsx so that
    // companies (null last_name) are correctly interleaved by company_name.
    query = query
      .order('last_name', { ascending: true, nullsFirst: false })
      .order('first_name', { ascending: true, nullsFirst: false })
      .order('company_name', { ascending: true, nullsFirst: false });

    const { data, count, error } = await query;

    if (error) throw error;
    return {
      clients: data as Client[],
      totalClients: count || 0
    };
  },

  async getClientById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Client;
  },

  async createClient(client: InsertClient) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  },

  async updateClient(id: string, client: UpdateClient) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Client;
  },

  async deleteClient(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('clients').delete().eq('id', id);

    if (error) throw error;
  }
};
