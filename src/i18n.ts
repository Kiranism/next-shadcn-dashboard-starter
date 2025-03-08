import { getRequestConfig } from 'next-intl/server';
import { defaultLocale } from './config/locales';

// This is the default locale loader function that next-intl uses
export default getRequestConfig(async (context: any) => {
  // Always use the default locale for simplicity
  const locale = defaultLocale;

  // Just load messages for the default locale
  const messages = (await import(`./messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    timeZone: 'UTC'
  };
});
