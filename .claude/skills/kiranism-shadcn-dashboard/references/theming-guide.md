# Theme Creation Guide

## Table of Contents

1. [Create Theme CSS](#1-create-theme-css)
2. [Import Theme](#2-import-theme)
3. [Register Theme](#3-register-theme)
4. [Add Custom Fonts](#4-add-custom-fonts-optional)
5. [Set as Default](#5-set-as-default-optional)
6. [Required Tokens](#required-tokens)
7. [Color Format Reference](#color-format-reference)

---

## 1. Create Theme CSS

Create `src/styles/themes/<name>.css`:

```css
/* Light mode */
[data-theme='your-theme'] {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(...);
  --card-foreground: oklch(...);
  --popover: oklch(...);
  --popover-foreground: oklch(...);
  --primary: oklch(...);
  --primary-foreground: oklch(...);
  --secondary: oklch(...);
  --secondary-foreground: oklch(...);
  --muted: oklch(...);
  --muted-foreground: oklch(...);
  --accent: oklch(...);
  --accent-foreground: oklch(...);
  --destructive: oklch(...);
  --destructive-foreground: oklch(...);
  --border: oklch(...);
  --input: oklch(...);
  --ring: oklch(...);
  --chart-1: oklch(...);
  --chart-2: oklch(...);
  --chart-3: oklch(...);
  --chart-4: oklch(...);
  --chart-5: oklch(...);
  --sidebar: oklch(...);
  --sidebar-foreground: oklch(...);
  --sidebar-primary: oklch(...);
  --sidebar-primary-foreground: oklch(...);
  --sidebar-accent: oklch(...);
  --sidebar-accent-foreground: oklch(...);
  --sidebar-border: oklch(...);
  --sidebar-ring: oklch(...);
  --font-sans: 'Font Name', sans-serif;
  --font-mono: 'Mono Font', monospace;
  --radius: 0.5rem;
  --spacing: 0.25rem;
}

/* Dark mode */
[data-theme='your-theme'].dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... all tokens with dark values */
}

/* Tailwind integration (required) */
[data-theme='your-theme'] {
  @theme inline {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-card: var(--card);
    --color-card-foreground: var(--card-foreground);
    --color-popover: var(--popover);
    --color-popover-foreground: var(--popover-foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-secondary: var(--secondary);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-accent: var(--accent);
    --color-accent-foreground: var(--accent-foreground);
    --color-destructive: var(--destructive);
    --color-destructive-foreground: var(--destructive-foreground);
    --color-border: var(--border);
    --color-input: var(--input);
    --color-ring: var(--ring);
    --color-chart-1: var(--chart-1);
    --color-chart-2: var(--chart-2);
    --color-chart-3: var(--chart-3);
    --color-chart-4: var(--chart-4);
    --color-chart-5: var(--chart-5);
    --color-sidebar: var(--sidebar);
    --color-sidebar-foreground: var(--sidebar-foreground);
    --color-sidebar-primary: var(--sidebar-primary);
    --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
    --color-sidebar-accent: var(--sidebar-accent);
    --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
    --color-sidebar-border: var(--sidebar-border);
    --color-sidebar-ring: var(--sidebar-ring);
    --font-sans: var(--font-sans);
    --font-mono: var(--font-mono);
    --font-serif: var(--font-serif);
    --radius-sm: calc(var(--radius) - 4px);
    --radius-md: calc(var(--radius) - 2px);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) + 4px);
  }
}
```

## 2. Import Theme

Add to `src/styles/theme.css`:

```css
@import './themes/your-theme.css';
```

## 3. Register Theme

Add to `THEMES` array in `src/components/themes/theme.config.ts`:

```typescript
{ name: 'Your Theme', value: 'your-theme' }
```

The `value` must exactly match the `data-theme` attribute in your CSS.

## 4. Add Custom Fonts (Optional)

Only if using a Google Font not already loaded.

In `src/components/themes/font.config.ts`:

```typescript
import { Your_Font } from 'next/font/google';

const fontYourName = Your_Font({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-your-name'
});

export const fontVariables = cn(
  // ... existing fonts
  fontYourName.variable
);
```

In your theme CSS, use the font's **display name** (not the CSS variable):

```css
--font-sans: 'Your Font', sans-serif;
```

## 5. Set as Default (Optional)

In `src/components/themes/theme.config.ts`:

```typescript
export const DEFAULT_THEME = 'your-theme';
```

## Required Tokens

Minimum required: `--background`, `--foreground`, `--card` & `--card-foreground`, `--popover` & `--popover-foreground`, `--primary` & `--primary-foreground`, `--secondary` & `--secondary-foreground`, `--muted` & `--muted-foreground`, `--accent` & `--accent-foreground`, `--destructive` & `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`.

Optional: `--chart-*`, `--sidebar-*`, `--font-*`, `--shadow-*`, `--tracking-normal`, `--spacing`.

## Color Format Reference

OKLCH: `oklch(lightness chroma hue)`

- Lightness: 0-1 (0=black, 1=white)
- Chroma: 0+ (0=gray, higher=saturated)
- Hue: 0-360 (0=red, 120=green, 240=blue)

See `src/styles/themes/claude.css` for a complete example.
