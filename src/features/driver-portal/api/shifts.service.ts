/**
 * Shifts service — shift and shift_events operations.
 *
 * Used by driver-portal (shift tracker at /driver/shift).
 * Uses standardized event types and statuses from ../types.
 */

import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import {
  SHIFT_EVENT_TYPES,
  SHIFT_STATUSES,
  type BreakReason,
  type Shift,
  type ShiftEvent
} from '../types';

export type InsertShift = Database['public']['Tables']['shifts']['Insert'];
export type UpdateShift = Database['public']['Tables']['shifts']['Update'];
export type InsertShiftEvent =
  Database['public']['Tables']['shift_events']['Insert'];

type CreateShiftEventParams = {
  shiftId: string;
  eventType: string;
  lat?: number | null;
  lng?: number | null;
  metadata?: Record<string, unknown> | null;
};

export const shiftsService = {
  /**
   * Get the active (non-ended) shift for a driver, if any.
   */
  async getActiveShift(driverId: string): Promise<Shift | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('driver_id', driverId)
      .neq('status', SHIFT_STATUSES.ENDED)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as Shift | null;
  },

  /**
   * Get shifts for a driver (e.g. last 7 days for history).
   */
  async getShiftsForDriver(
    driverId: string,
    options?: { limit?: number; fromDate?: string }
  ): Promise<Shift[]> {
    const supabase = createClient();
    let query = supabase
      .from('shifts')
      .select('*')
      .eq('driver_id', driverId)
      .order('started_at', { ascending: false });

    if (options?.fromDate) {
      query = query.gte('started_at', options.fromDate);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Shift[];
  },

  /**
   * Start a new shift. Creates shift + shift_start event.
   */
  async startShift(params: {
    driverId: string;
    companyId: string;
    vehicleId?: string | null;
    startOdometer?: number | null;
    lat?: number | null;
    lng?: number | null;
  }): Promise<Shift> {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .insert({
        driver_id: params.driverId,
        company_id: params.companyId,
        vehicle_id: params.vehicleId ?? null,
        started_at: now,
        status: SHIFT_STATUSES.ACTIVE,
        start_odometer: params.startOdometer ?? null
      })
      .select()
      .single();

    if (shiftError) throw shiftError;

    await this.createShiftEvent({
      shiftId: shift.id,
      eventType: SHIFT_EVENT_TYPES.SHIFT_START,
      lat: params.lat,
      lng: params.lng
    });

    return shift as Shift;
  },

  /**
   * End the current shift. Creates shift_end event and updates shift.
   */
  async endShift(params: {
    shiftId: string;
    endOdometer?: number | null;
    lat?: number | null;
    lng?: number | null;
  }): Promise<Shift> {
    const supabase = createClient();
    const now = new Date().toISOString();

    await this.createShiftEvent({
      shiftId: params.shiftId,
      eventType: SHIFT_EVENT_TYPES.SHIFT_END,
      lat: params.lat,
      lng: params.lng
    });

    const { data, error } = await supabase
      .from('shifts')
      .update({
        status: SHIFT_STATUSES.ENDED,
        ended_at: now,
        end_odometer: params.endOdometer ?? undefined
      })
      .eq('id', params.shiftId)
      .select()
      .single();

    if (error) throw error;
    return data as Shift;
  },

  /**
   * Start a break. Creates break_start event and updates shift status.
   */
  async startBreak(params: {
    shiftId: string;
    reason?: BreakReason | null;
    lat?: number | null;
    lng?: number | null;
  }): Promise<Shift> {
    const supabase = createClient();

    await this.createShiftEvent({
      shiftId: params.shiftId,
      eventType: SHIFT_EVENT_TYPES.BREAK_START,
      lat: params.lat,
      lng: params.lng,
      metadata: params.reason ? { reason: params.reason } : null
    });

    const { data, error } = await supabase
      .from('shifts')
      .update({ status: SHIFT_STATUSES.ON_BREAK })
      .eq('id', params.shiftId)
      .select()
      .single();

    if (error) throw error;
    return data as Shift;
  },

  /**
   * End a break. Creates break_end event and updates shift status to active.
   */
  async endBreak(params: {
    shiftId: string;
    lat?: number | null;
    lng?: number | null;
  }): Promise<Shift> {
    const supabase = createClient();

    await this.createShiftEvent({
      shiftId: params.shiftId,
      eventType: SHIFT_EVENT_TYPES.BREAK_END,
      lat: params.lat,
      lng: params.lng
    });

    const { data, error } = await supabase
      .from('shifts')
      .update({ status: SHIFT_STATUSES.ACTIVE })
      .eq('id', params.shiftId)
      .select()
      .single();

    if (error) throw error;
    return data as Shift;
  },

  /**
   * Create a shift_event row. Internal helper.
   */
  async createShiftEvent(params: CreateShiftEventParams): Promise<ShiftEvent> {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('shift_events')
      .insert({
        shift_id: params.shiftId,
        event_type: params.eventType,
        lat: params.lat ?? null,
        lng: params.lng ?? null,
        metadata: params.metadata ?? null,
        timestamp: now
      })
      .select()
      .single();

    if (error) throw error;
    return data as ShiftEvent;
  }
};
