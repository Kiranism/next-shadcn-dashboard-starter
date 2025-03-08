export const locales = ['en', 'it', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale = 'en' as const;
