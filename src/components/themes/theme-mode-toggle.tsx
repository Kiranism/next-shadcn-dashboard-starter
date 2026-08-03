'use client';

import { Icons } from '@/components/icons';
import { useTheme } from 'next-themes';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Kbd } from '@/components/ui/kbd';
import { startThemeTransition } from '@/lib/theme-transition';

export function ThemeModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const handleThemeToggle = React.useCallback(
    (e?: React.MouseEvent) => {
      const newMode = resolvedTheme === 'dark' ? 'light' : 'dark';
      // Circular reveal from the click point (falls back to center for the
      // keyboard shortcut, which passes no event).
      startThemeTransition(() => setTheme(newMode), e);
    },
    [resolvedTheme, setTheme]
  );

  // Cmd/Ctrl+Shift+D toggles the theme; kbar separately handles the 'D D' sequence
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'd' || !e.shiftKey || !(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }
      e.preventDefault();
      handleThemeToggle();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleThemeToggle]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='secondary'
            size='icon'
            className='group/toggle size-8'
            onClick={handleThemeToggle}
          />
        }
      >
        <Icons.brightness />
        <span className='sr-only'>Toggle theme</span>
      </TooltipTrigger>
      <TooltipContent>
        Toggle theme <Kbd>⌘⇧D</Kbd> <Kbd>D D</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}
