'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

// global-error replaces the root layout when it errors, so globals.css is not
// loaded here — styles must be inline and self-contained.
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang='en'>
      <body
        style={{
          margin: 0,
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}
      >
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#6b7280', marginBottom: '1.25rem' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid #d1d5db',
              background: 'transparent',
              font: 'inherit',
              cursor: 'pointer'
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
