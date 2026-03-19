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
  type Shift
} from '../types';

export type InsertShift = Database['public']['Tables']['shifts']['Insert'];
export type UpdateShift = Database['public']['Tables']['shifts']['Update'];
export type InsertShiftEvent =
  Database['public']['Tables']['shift_events']['Insert'];

type CreateShiftEventParams = {
  shiftId: string;
  eventType: string;
  timestamp?: string;
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
   * Get completed shifts with events for a driver (history list).
   * Used for displaying worked days with start, breaks, end.
   */
  async getShiftsWithEvents(
    driverId: string,
    options?: { limit?: number }
  ): Promise<
    Array<
      Shift & {
        shift_events: Array<{ event_type: string; timestamp: string | null }>;
      }
    >
  > {
    const supabase = createClient();
    let query = supabase
      .from('shifts')
      .select(
        `
        *,
        shift_events (
          event_type,
          timestamp
        )
      `
      )
      .eq('driver_id', driverId)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Array<
      Shift & {
        shift_events: Array<{ event_type: string; timestamp: string | null }>;
      }
    >;
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
   * Get shift for a driver on a specific date (YYYY-MM-DD), if any.
   * Used for duplicate check when creating manual shifts.
   */
  async getShiftForDriverByDate(
    driverId: string,
    date: string
  ): Promise<Shift | null> {
    const supabase = createClient();
    const dayStart = `${date}T00:00:00.000Z`;
    const dayEnd = `${date}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('driver_id', driverId)
      .gte('started_at', dayStart)
      .lte('started_at', dayEnd)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as Shift | null;
  },

  /**
   * Delete a shift and its events. Used when overwriting duplicate day.
   */
  async deleteShift(shiftId: string): Promise<void> {
    const supabase = createClient();
    const { error: eventsError } = await supabase
      .from('shift_events')
      .delete()
      .eq('shift_id', shiftId);
    if (eventsError) throw eventsError;

    const { error: shiftError } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId);
    if (shiftError) throw shiftError;
  },

  /**
   * Create a manual shift with custom timestamps.
   * Used when drivers enter times via form instead of tap-to-track.
   * Supports multiple breaks; each break creates break_start and break_end events.
   */
  async createManualShift(params: {
    driverId: string;
    companyId: string;
    vehicleId?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    breaks?: Array<{ start: string; end: string }>;
  }): Promise<Shift> {
    const supabase = createClient();
    // Parse as local time so driver's 08:30 is stored correctly
    const startedAt = new Date(
      `${params.date}T${params.startTime}:00`
    ).toISOString();
    const endedAt = new Date(
      `${params.date}T${params.endTime}:00`
    ).toISOString();

    const { data: shift, error: shiftError } = await supabase
      .from('shifts')
      .insert({
        driver_id: params.driverId,
        company_id: params.companyId,
        vehicle_id: params.vehicleId ?? null,
        started_at: startedAt,
        ended_at: endedAt,
        status: SHIFT_STATUSES.ENDED
      })
      .select()
      .single();

    if (shiftError) throw shiftError;

    await this.createShiftEvent({
      shiftId: shift.id,
      eventType: SHIFT_EVENT_TYPES.SHIFT_START,
      timestamp: startedAt
    });

    const breaks = params.breaks ?? [];
    for (const br of breaks) {
      if (br.start && br.end) {
        const breakStartTs = new Date(
          `${params.date}T${br.start}:00`
        ).toISOString();
        const breakEndTs = new Date(
          `${params.date}T${br.end}:00`
        ).toISOString();
        await this.createShiftEvent({
          shiftId: shift.id,
          eventType: SHIFT_EVENT_TYPES.BREAK_START,
          timestamp: breakStartTs,
          metadata: { reason: 'Mittagspause' }
        });
        await this.createShiftEvent({
          shiftId: shift.id,
          eventType: SHIFT_EVENT_TYPES.BREAK_END,
          timestamp: breakEndTs
        });
      }
    }

    await this.createShiftEvent({
      shiftId: shift.id,
      eventType: SHIFT_EVENT_TYPES.SHIFT_END,
      timestamp: endedAt
    });

    return shift as Shift;
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
  async createShiftEvent(params: CreateShiftEventParams): Promise<void> {
    const supabase = createClient();
    const timestamp = params.timestamp ?? new Date().toISOString();

    const { error } = await supabase.from('shift_events').insert({
      shift_id: params.shiftId,
      event_type: params.eventType,
      lat: params.lat ?? null,
      lng: params.lng ?? null,
      metadata: params.metadata ?? null,
      timestamp
    });

    if (error) throw error;
  }
};
