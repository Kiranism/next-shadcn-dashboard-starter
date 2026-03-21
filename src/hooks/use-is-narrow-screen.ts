'use client';

import * as React from 'react';

/**
 * True when viewport is below `maxWidthPx` (default 768 — phones and small tablets).
 */
export function useIsNarrowScreen(maxWidthPx = 768): boolean {
  const [narrow, setNarrow] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidthPx - 1}px)`);
    setNarrow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [maxWidthPx]);

  return narrow;
}
