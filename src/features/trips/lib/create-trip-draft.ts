import { z } from 'zod';
import type { ReturnMode } from '@/features/trips/components/create-trip/schema';

export const CREATE_TRIP_DRAFT_STORAGE_KEY = 'taxigo:create-trip-draft:v1';
export const CREATE_TRIP_DRAFT_SCHEMA_VERSION = 1 as const;

const draftValuesSchema = z.object({
  payer_id: z.string(),
  billing_type_id: z.string(),
  scheduled_at: z.string(),
  return_mode: z.enum(['none', 'time_tbd', 'exact']),
  return_date: z.union([z.string(), z.null()]).optional(),
  return_time: z.string().optional(),
  driver_id: z.string().optional(),
  is_wheelchair: z.boolean(),
  notes: z.string().optional()
});

export const createTripDraftSchema = z.object({
  schemaVersion: z.literal(1),
  updatedAt: z.string(),
  values: draftValuesSchema,
  passengers: z.array(z.any()),
  pickupGroups: z.array(z.any()),
  dropoffGroups: z.array(z.any())
});

export type CreateTripDraftStored = z.infer<typeof createTripDraftSchema>;

export function parseCreateTripDraft(
  raw: string | null
): CreateTripDraftStored | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    const parsed = createTripDraftSchema.safeParse(data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function buildTripFormValuesFromDraft(
  d: CreateTripDraftStored['values']
): {
  payer_id: string;
  billing_type_id: string;
  scheduled_at: Date;
  return_mode: ReturnMode;
  return_date: Date | undefined;
  return_time: string;
  driver_id: string;
  is_wheelchair: boolean;
  notes: string;
} {
  return {
    payer_id: d.payer_id,
    billing_type_id: d.billing_type_id,
    scheduled_at: new Date(d.scheduled_at),
    return_mode: d.return_mode,
    return_date: d.return_date ? new Date(d.return_date) : undefined,
    return_time: d.return_time ?? '',
    driver_id: d.driver_id ?? '__none__',
    is_wheelchair: d.is_wheelchair,
    notes: d.notes ?? ''
  };
}
