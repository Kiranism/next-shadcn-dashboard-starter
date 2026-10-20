import * as React from 'react';

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
) {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;

  const debounceTimerRef = React.useRef(0);

  React.useEffect(() => () => window.clearTimeout(debounceTimerRef.current), []);

  return React.useCallback(
    (...args: Parameters<T>) => {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = window.setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay]
  );
}
