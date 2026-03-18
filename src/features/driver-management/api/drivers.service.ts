/**
 * Drivers service — CRUD for accounts with role='driver'.
 *
 * Used by driver-management (admin Fahrer page). Driver creation
 * (auth + accounts + driver_profiles) is handled by POST /api/drivers/create
 * using Supabase service role.
 */

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import type { DriverWithProfile } from '../types';

export type InsertUser = Database['public']['Tables']['accounts']['Insert'];
export type UpdateUser = Database['public']['Tables']['accounts']['Update'];

type GetDriversFilters = {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
};

export const driversService = {
  /**
   * Fetch drivers (accounts with role='driver'), optionally with driver_profiles.
   * For list view, omit driver_profiles join to avoid RLS/join issues.
   */
  async getDrivers(filters?: GetDriversFilters): Promise<{
    drivers: DriverWithProfile[];
    totalDrivers: number;
  }> {
    const supabase = createClient();
    let query = supabase
      .from('accounts')
      .select(
        'id, name, first_name, last_name, email, role, phone, company_id, is_active',
        { count: 'exact' }
      )
      .eq('role', 'driver');

    if (!filters?.includeInactive) {
      query = query.eq('is_active', true);
    }

    if (filters?.search) {
      const term = `%${filters.search}%`;
      query = query.or(
        `name.ilike.${term},first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`
      );
    }

    query = query.order('name', { ascending: true });

    if (filters?.page && filters?.limit) {
      const from = (filters.page - 1) * filters.limit;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;

    if (error) {
      const msg =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : String(error);
      throw new Error(`Fahrer konnten nicht geladen werden: ${msg}`);
    }
    return {
      drivers: (data || []) as DriverWithProfile[],
      totalDrivers: count ?? 0
    };
  },

  /**
   * Fetch a single account by id with driver_profile. Used for edit form.
   * Fetches account and driver_profiles separately to avoid "Cannot coerce to single
   * JSON object" when a user has multiple driver_profiles rows.
   */
  async getDriverById(id: string): Promise<DriverWithProfile | null> {
    const supabase = createClient();
    const { data: user, error: userError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (userError || !user) return null;

    const { data: profiles } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', id);

    return { ...user, driver_profiles: profiles ?? [] } as DriverWithProfile;
  },

  /**
   * Update driver (accounts table). Used for edit form.
   */
  async updateDriver(
    id: string,
    updates: UpdateUser
  ): Promise<DriverWithProfile> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      const msg =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : String(error);
      throw new Error(`Fahrer konnte nicht aktualisiert werden: ${msg}`);
    }
    if (!data || data.length === 0) {
      throw new Error(
        'Fahrer konnte nicht aktualisiert werden: Kein Eintrag gefunden.'
      );
    }
    return data[0] as DriverWithProfile;
  },

  /**
   * Upsert driver_profile for a user. Used when editing driver details.
   */
  async upsertDriverProfile(
    userId: string,
    data: {
      license_number?: string | null;
      default_vehicle_id?: string | null;
      street?: string | null;
      street_number?: string | null;
      zip_code?: string | null;
      city?: string | null;
      lat?: number | null;
      lng?: number | null;
    }
  ): Promise<void> {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from('driver_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const profileData = {
      license_number: data.license_number ?? null,
      default_vehicle_id: data.default_vehicle_id ?? null,
      street: data.street ?? null,
      street_number: data.street_number ?? null,
      zip_code: data.zip_code ?? null,
      city: data.city ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null
    };
    if (existing) {
      const { error } = await supabase
        .from('driver_profiles')
        .update(profileData)
        .eq('user_id', userId);
      if (error) {
        const msg =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message?: string }).message
            : String(error);
        throw new Error(
          `Fahrerprofil konnte nicht aktualisiert werden: ${msg}`
        );
      }
    } else {
      const { error } = await supabase.from('driver_profiles').insert({
        user_id: userId,
        ...profileData
      });
      if (error) {
        const msg =
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message?: string }).message
            : String(error);
        throw new Error(`Fahrerprofil konnte nicht angelegt werden: ${msg}`);
      }
    }
  },

  /**
   * Soft-deactivate a driver (is_active = false). Use instead of hard delete.
   */
  async deactivateDriver(id: string): Promise<void> {
    await this.updateDriver(id, { is_active: false });
  }
};
