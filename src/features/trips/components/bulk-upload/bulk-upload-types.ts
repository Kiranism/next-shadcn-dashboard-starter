export type ParsedCsvRow = {
  kostentraeger: string;
  abrechnungsart?: string;
  date: string;
  /** Optional — if omitted the trip is created with scheduled_at = NULL and requested_date set. */
  time?: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  greeting_style?: string;
  pickup_street: string;
  pickup_zip: string;
  pickup_city: string;
  pickup_station?: string;
  dropoff_street: string;
  dropoff_zip: string;
  dropoff_city: string;
  dropoff_station?: string;
  is_wheelchair?: string;
  notes?: string;
  group_id?: string;
  driver_name?: string;
};

export type ValidationIssueType =
  | 'payer_not_found'
  | 'billing_type_not_found'
  | 'invalid_datetime'
  | 'client_unresolved'
  | 'ambiguous_client'
  | 'driver_unresolved';

export interface ValidationIssue {
  type: ValidationIssueType;
  message: string;
}

export interface ValidatedTripRow<TripShape = unknown> {
  rowNumber: number;
  source: ParsedCsvRow;
  trip: TripShape | null;
  issues: ValidationIssue[];
  clientId?: string | null;
  /** True when the billing type's returnPolicy demands an auto-created return trip. */
  needsReturnTrip?: boolean;
  /** True when at least one address field was overridden by a behavior rule default. */
  addressOverrideApplied?: boolean;
}

export interface UnresolvedRow<TripShape = unknown> {
  tripId: string;
  row: ValidatedTripRow<TripShape>;
}

/**
 * A DB-backed row used when rehydrating the wizard after dialog close.
 * Contains only the fields that are actually stored on the `trips` table.
 *
 * clientFirstName / clientLastName carry the original CSV columns separately
 * so the wizard never has to guess the split from the concatenated clientName.
 * Both are null in the resume-from-DB path (the DB only stores the combined
 * client_name), in which case the wizard falls back to a space-split.
 */
export interface RehydratedTripRow {
  tripId: string;
  clientName: string | null;
  clientFirstName: string | null;
  clientLastName: string | null;
  clientPhone: string | null;
  pickupAddress: string | null;
  pickupStreet: string | null;
  pickupStreetNumber: string | null;
  pickupZip: string | null;
  pickupCity: string | null;
  dropoffAddress: string | null;
  dropoffStreet: string | null;
  dropoffStreetNumber: string | null;
  dropoffZip: string | null;
  dropoffCity: string | null;
  greetingStyle: string | null;
}
