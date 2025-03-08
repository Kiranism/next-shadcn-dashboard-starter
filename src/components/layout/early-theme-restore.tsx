'use client';

import { useEffect } from 'react';
import { applyTheme } from '@/utils/theme-persistence';

/**
 * Component that restores theme settings as early as possible in the application lifecycle
 * This should be placed high in the component tree, before any theme-dependent components
 */
export default function EarlyThemeRestore() {
  useEffect(() => {
    // Apply saved theme immediately when component mounts
    // This happens very early in page load
    applyTheme();
  }, []);

  // This component doesn't render anything
  return null;
}
