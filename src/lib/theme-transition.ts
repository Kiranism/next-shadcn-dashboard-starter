/**
 * Animate a theme (mode or palette) change with a circular reveal from the
 * pointer position, using the View Transitions API. Falls back to an instant
 * change where the API is unavailable or no origin is given. The reveal
 * keyframes live in `src/styles/globals.css`.
 */
export function startThemeTransition(
  apply: () => void,
  origin?: { clientX: number; clientY: number }
) {
  const root = document.documentElement;

  if (!document.startViewTransition) {
    apply();
    return;
  }

  if (origin) {
    root.style.setProperty('--x', `${origin.clientX}px`);
    root.style.setProperty('--y', `${origin.clientY}px`);
  }

  document.startViewTransition(apply);
}
