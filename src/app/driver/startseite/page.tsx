import { StartseitePageContent } from '@/features/driver-portal/components/startseite/startseite-page-content';

/**
 * Startseite — driver home page.
 *
 * Shows today's shift status card and the list of
 * today's assigned trips. All data fetching happens
 * client-side inside StartseitePageContent.
 */
export default function StartseiteePage() {
  return <StartseitePageContent />;
}
