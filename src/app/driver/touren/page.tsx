import { TourenPageContent } from '@/features/driver-portal/components/touren/touren-page-content';

/**
 * Touren — driver trip browser page.
 *
 * Shows a searchable, filterable list of all trips
 * assigned to the current driver. Drivers can also
 * start a trip from here (updates status → in_progress).
 */
export default function TourenPage() {
  return <TourenPageContent />;
}
