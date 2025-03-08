'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

/**
 * A component that monitors theme changes and provides debugging information
 */
export default function ThemeListener() {
  const { theme, resolvedTheme, systemTheme } = useTheme();
  const prevThemeRef = useRef<string | undefined>(theme);

  // Log theme changes
  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      console.log('[ThemeListener] Theme changed:', {
        from: prevThemeRef.current,
        to: theme,
        resolved: resolvedTheme,
        system: systemTheme
      });

      // Log localStorage state
      const themeInStorage = localStorage.getItem('theme');
      const tempThemeInStorage = localStorage.getItem('__theme_temp');

      console.log('[ThemeListener] Storage state:', {
        theme: themeInStorage,
        __theme_temp: tempThemeInStorage
      });

      prevThemeRef.current = theme;
    }
  }, [theme, resolvedTheme, systemTheme]);

  // This component doesn't render anything
  return null;
}
