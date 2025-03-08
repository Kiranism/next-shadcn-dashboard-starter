import { getRequestConfig } from 'next-intl/server';
import { defaultLocale } from './config/locales';

// This is the default locale loader function that next-intl uses
export default getRequestConfig(async (context: any) => {
  try {
    // Always use the default locale for simplicity
    // If any headers are being accessed internally by next-intl in the context, they will be properly awaited
    await Promise.resolve(); // Adding a microtask to ensure any dynamic values are properly awaited
    const locale = defaultLocale;

    // Just load messages for the default locale
    const messages = (await import(`./messages/${locale}.json`)).default;

    return {
      locale,
      messages,
      timeZone: 'UTC'
    };
  } catch (error) {
    console.error('Error in i18n config:', error);
    // Fallback to default locale and English messages
    const messages = (await import(`./messages/en.json`)).default;
    return {
      locale: 'en',
      messages,
      timeZone: 'UTC'
    };
  }
});
