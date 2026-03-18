import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

export type Trip = Database['public']['Tables']['trips']['Row'];
export type InsertTrip = Database['public']['Tables']['trips']['Insert'];
export type UpdateTrip = Database['public']['Tables']['trips']['Update'];

export const tripsService = {
  async getTrips() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('scheduled_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTripById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trips')
      .select(
        '*, billing_types(*), clients(*), payers(*), driver:accounts!trips_driver_id_fkey(name)'
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createTrip(trip: InsertTrip) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trips')
      .insert(trip)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async bulkCreateTrips(trips: InsertTrip[]) {
    const supabase = createClient();
    const { data, error } = await supabase.from('trips').insert(trips).select();

    if (error) throw error;
    return data;
  },

  async updateTrip(id: string, trip: UpdateTrip) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trips')
      .update(trip)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTrip(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('trips').delete().eq('id', id);

    if (error) throw error;
  },

  async getUpcomingTrips(startDate: string, endDate: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('trips')
      .select(
        '*, driver:accounts!trips_driver_id_fkey(name), billing_types(name, color)'
      )
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data;
  }
};
