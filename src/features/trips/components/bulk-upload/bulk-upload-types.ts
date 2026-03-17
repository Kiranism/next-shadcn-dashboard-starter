export type ParsedCsvRow = {
  kostentraeger: string;
  abrechnungsart?: string;
  date: string;
  time: string;
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
}

export interface UnresolvedRow<TripShape = unknown> {
  tripId: string;
  row: ValidatedTripRow<TripShape>;
}

/**
 * A DB-backed row used when rehydrating the wizard after dialog close.
 * Contains only the fields that are actually stored on the `trips` table.
 */
export interface RehydratedTripRow {
  tripId: string;
  clientName: string | null;
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
