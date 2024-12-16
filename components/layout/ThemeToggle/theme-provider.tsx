'use client';

import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps
} from 'next-themes';

export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
