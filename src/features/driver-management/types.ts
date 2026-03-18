/**
 * Driver management types — used by admin CRUD (Fahrer page).
 *
 * This feature owns driver roster data: accounts + driver_profiles.
 * See driver-portal for shift-related types.
 */

import type { Database } from '@/types/database.types';

/** Account row from DB (public.accounts, formerly users). */
export type User = Database['public']['Tables']['accounts']['Row'];

/** Driver profile row (driver_profiles table). */
export type DriverProfile =
  Database['public']['Tables']['driver_profiles']['Row'];

/** Account with optional driver_profiles joined. Used in admin driver listing and forms. */
export interface DriverWithProfile extends User {
  driver_profiles?: DriverProfile | DriverProfile[] | null;
}
