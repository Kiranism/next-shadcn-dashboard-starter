/**
 * Drivers service — CRUD for users with role='driver'.
 *
 * Driver creation (auth + users + driver_profiles) is handled by
 * POST /api/drivers/create using Supabase service role.
 */

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import type { DriverWithProfile } from '../types';

export type InsertUser = Database['public']['Tables']['users']['Insert'];
export type UpdateUser = Database['public']['Tables']['users']['Update'];

type GetDriversFilters = {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
};

export const driversService = {
  /**
   * Fetch drivers (users with role='driver'), optionally with driver_profiles.
   * For list view, omit driver_profiles join to avoid RLS/join issues.
   */
  async getDrivers(filters?: GetDriversFilters): Promise<{
    drivers: DriverWithProfile[];
    totalDrivers: number;
  }> {
    const supabase = createClient();
    let query = supabase
      .from('users')
      .select('id, name, role, phone, company_id, is_active', {
        count: 'exact'
      })
      .eq('role', 'driver');

    if (!filters?.includeInactive) {
      query = query.eq('is_active', true);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
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
   * Fetch a single user by id with driver_profile. Used for edit form.
   */
  async getDriverById(id: string): Promise<DriverWithProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*, driver_profiles(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('driversService.getDriverById:', error);
      return null;
    }
    if (!data) return null;
    return data as DriverWithProfile;
  },

  /**
   * Update driver (users table). Used for edit form.
   */
  async updateDriver(
    id: string,
    updates: UpdateUser
  ): Promise<DriverWithProfile> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('*, driver_profiles(*)')
      .single();

    if (error) {
      const msg =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : String(error);
      throw new Error(`Fahrer konnte nicht aktualisiert werden: ${msg}`);
    }
    return data as DriverWithProfile;
  },

  /**
   * Upsert driver_profile for a user. Used when editing driver details.
   */
  async upsertDriverProfile(
    userId: string,
    data: { license_number?: string | null; default_vehicle_id?: string | null }
  ): Promise<void> {
    const supabase = createClient();
    const { data: existing } = await supabase
      .from('driver_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('driver_profiles')
        .update(data)
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
        license_number: data.license_number ?? null,
        default_vehicle_id: data.default_vehicle_id ?? null
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
