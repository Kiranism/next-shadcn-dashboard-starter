import { type UrgencyLevel } from './urgency-logic';

/**
 * Translations for Urgency Indicators
 */
export const URGENCY_TRANSLATIONS = {
  de: {
    upcoming: {
      label: 'Geplant',
      description: 'Vorbereitung / Warteschlange'
    },
    imminent: {
      label: 'Gleich',
      description: 'Kritisch / Dispatch erforderlich'
    },
    due: {
      label: 'Jetzt',
      description: 'Sollte jetzt starten'
    },
    overdue: {
      label: 'Überfällig',
      description: 'Sofortige Aufmerksamkeit erforderlich'
    },
    none: {
      label: '',
      description: ''
    }
  }
} as const;

export type LanguageCode = keyof typeof URGENCY_TRANSLATIONS;

/**
 * Helper to get localized urgency label and description.
 * Defaults to German as requested.
 */
export function getUrgencyTranslation(
  level: UrgencyLevel,
  locale: LanguageCode = 'de'
) {
  return (
    URGENCY_TRANSLATIONS[locale][level] || URGENCY_TRANSLATIONS[locale].none
  );
}
