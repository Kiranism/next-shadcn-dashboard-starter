# Adding New Themes

This guide explains how to add a new theme to the application. The theme system uses CSS custom properties with `[data-theme]` selectors for easy theme switching.

## The Journey: Adding a New Theme

When adding a new theme, follow this journey:

1. **Create theme CSS file** → `src/styles/themes/your-theme-name.css` with `[data-theme='your-theme-name']`
2. **Import theme** → Add `@import` to `src/styles/theme.css`
3. **Register theme** → Add to `THEMES` array in `src/components/themes/theme.config.ts`
4. **Add fonts (if needed)** → Import fonts in `src/components/themes/font.config.ts` if using custom Google Fonts
5. **Set as default (optional)** → Update `DEFAULT_THEME` in `src/components/themes/active-theme.tsx`

See the **Step-by-Step Guide** section below for detailed instructions.

## Quick Start: Set Your Theme as Default

To make your new theme the default (so it loads automatically without the theme switcher):

1. Open `src/components/themes/active-theme.tsx`
2. Change line 12: `const DEFAULT_THEME = 'your-theme-name';`
3. Save and restart your dev server

That's it! Your theme will now be the default for all new users.

> **Note:** Make sure you've completed steps 1-3 above before setting a theme as default.

## Theme Structure

All themes are located in `src/styles/themes/` directory. Each theme is a complete, self-contained CSS file that defines all design tokens for both light and dark modes.

## File Format

Each theme file must follow this structure:

```css
/* Light mode tokens */
[data-theme='your-theme-name'] {
  /* Color tokens */
  --background: oklch(...);
  --foreground: oklch(...);
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

  /* Chart colors */
  --chart-1: oklch(...);
  --chart-2: oklch(...);
  --chart-3: oklch(...);
  --chart-4: oklch(...);
  --chart-5: oklch(...);

  /* Sidebar colors */
  --sidebar: oklch(...);
  --sidebar-foreground: oklch(...);
  --sidebar-primary: oklch(...);
  --sidebar-primary-foreground: oklch(...);
  --sidebar-accent: oklch(...);
  --sidebar-accent-foreground: oklch(...);
  --sidebar-border: oklch(...);
  --sidebar-ring: oklch(...);

  /* Typography */
  /* Option 1: Use fonts from next/font/google (recommended) */
  --font-sans: 'Font Name', sans-serif; /* Use the font's display name */
  --font-serif: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  --font-mono: 'Mono Font Name', monospace;

  /* Option 2: Use system fonts */
  /* --font-sans: ui-sans-serif, system-ui, -apple-system, sans-serif; */

  /* Spacing & Layout */
  --radius: 0.5rem;
  --spacing: 0.25rem;

  /* Shadows (optional) */
  --shadow-x: 0px;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.17;
  --shadow-color: #000000;
  --shadow-2xs: 0px 1px 3px 0px hsl(0 0% 0% / 0.09);
  --shadow-xs: 0px 1px 3px 0px hsl(0 0% 0% / 0.09);
  --shadow-sm: 0px 1px 3px 0px hsl(0 0% 0% / 0.17),
    0px 1px 2px -1px hsl(0 0% 0% / 0.17);
  --shadow: 0px 1px 3px 0px hsl(0 0% 0% / 0.17),
    0px 1px 2px -1px hsl(0 0% 0% / 0.17);
  --shadow-md: 0px 1px 3px 0px hsl(0 0% 0% / 0.17),
    0px 2px 4px -1px hsl(0 0% 0% / 0.17);
  --shadow-lg: 0px 1px 3px 0px hsl(0 0% 0% / 0.17),
    0px 4px 6px -1px hsl(0 0% 0% / 0.17);
  --shadow-xl: 0px 1px 3px 0px hsl(0 0% 0% / 0.17),
    0px 8px 10px -1px hsl(0 0% 0% / 0.17);
  --shadow-2xl: 0px 1px 3px 0px hsl(0 0% 0% / 0.43);

  /* Letter spacing (optional) */
  --tracking-normal: 0em;
}

/* Dark mode tokens */
[data-theme='your-theme-name'].dark {
  /* Same tokens as above, but with dark mode values */
  --background: oklch(...);
  --foreground: oklch(...);
  /* ... all other tokens with dark mode values */
}

/* Theme inline mappings */
[data-theme='your-theme-name'] {
  @theme inline {
    /* Color mappings */
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

    /* Font mappings */
    --font-sans: var(--font-sans);
    --font-mono: var(--font-mono);
    --font-serif: var(--font-serif);

    /* Radius variants */
    --radius-sm: calc(var(--radius) - 4px);
    --radius-md: calc(var(--radius) - 2px);
    --radius-lg: var(--radius);
    --radius-xl: calc(var(--radius) + 4px);

    /* Shadow mappings (if shadows are defined) */
    --shadow-2xs: var(--shadow-2xs);
    --shadow-xs: var(--shadow-xs);
    --shadow-sm: var(--shadow-sm);
    --shadow: var(--shadow);
    --shadow-md: var(--shadow-md);
    --shadow-lg: var(--shadow-lg);
    --shadow-xl: var(--shadow-xl);
    --shadow-2xl: var(--shadow-2xl);

    /* Tracking variants (if tracking-normal is defined) */
    --tracking-tighter: calc(var(--tracking-normal) - 0.05em);
    --tracking-tight: calc(var(--tracking-normal) - 0.025em);
    --tracking-normal: var(--tracking-normal);
    --tracking-wide: calc(var(--tracking-normal) + 0.025em);
    --tracking-wider: calc(var(--tracking-normal) + 0.05em);
    --tracking-widest: calc(var(--tracking-normal) + 0.1em);
  }
}
```

## Step-by-Step Guide: Adding a New Theme

Follow these steps in order to add a new theme to your application.

### Step 1: Create Theme CSS File

Create a new file in `src/styles/themes/` with a descriptive name (use kebab-case):

```bash
src/styles/themes/your-theme-name.css
```

**Important:** The filename should match the `data-theme` attribute value you'll use in the CSS.

### Step 2: Define Your Theme with `[data-theme]` Attribute

Copy the structure from the "File Format" section above and fill in your color values. Use OKLCH color format for better color consistency:

```css
/* Light mode tokens */
[data-theme='your-theme-name'] {
  --background: oklch(1 0 0); /* White */
  --foreground: oklch(0.145 0 0); /* Dark gray */
  --card: oklch(...);
  /* ... all other tokens */
}

/* Dark mode tokens */
[data-theme='your-theme-name'].dark {
  --background: oklch(0.145 0 0); /* Dark */
  --foreground: oklch(0.985 0 0); /* Light */
  /* ... all other tokens with dark mode values */
}

/* Theme inline mappings for Tailwind */
[data-theme='your-theme-name'] {
  @theme inline {
    /* All the mappings as shown in the File Format section */
  }
}
```

**Color Format:**

- Use `oklch()` format: `oklch(lightness chroma hue)`
- Example: `oklch(0.852 0.199 91.936)` = light green-blue
- Lightness: 0-1 (0 = black, 1 = white)
- Chroma: 0+ (0 = grayscale, higher = more saturated)
- Hue: 0-360 (color wheel position)

**Key Points:**

- The `[data-theme='your-theme-name']` selector is what makes your theme work
- The value `'your-theme-name'` must match exactly in all places (CSS file, config, etc.)
- Always include both light and dark mode variants
- Include the `@theme inline` block for Tailwind CSS integration

### Step 3: Import Theme in theme.css

Add your theme import to `src/styles/theme.css`:

```css
@import './themes/your-theme-name.css';
```

This makes your theme available to the application.

### Step 4: Add Theme to theme.config.ts

Add your theme to the `THEMES` array in `src/components/themes/theme.config.ts`:

```typescript
export const THEMES = [
  // ... existing themes
  {
    name: 'Your Theme Name', // Display name in the UI
    value: 'your-theme-name' // Must match [data-theme] value exactly
  }
];
```

**Important:** The `value` field must match the `data-theme` attribute value from your CSS file exactly.

### Step 5: Add Custom Fonts (If Needed)

**Only do this step if your theme requires a custom Google Font that isn't already loaded.**

If you want to use a Google Font in your theme:

**File:** `src/components/themes/font.config.ts`

1. **Import the font** from `next/font/google`:

```typescript
import { Your_Font_Name } from 'next/font/google';
```

2. **Configure the font** with a CSS variable:

```typescript
const fontYourName = Your_Font_Name({
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Adjust weights as needed
  variable: '--font-your-name' // Optional: custom variable name
});
```

3. **Add it to the `fontVariables` export**:

```typescript
export const fontVariables = cn(
  // ... existing fonts
  fontYourName.variable
);
```

4. **Use the font in your theme CSS** by its display name (not the CSS variable):

```css
[data-theme='your-theme-name'] {
  --font-sans: 'Your Font Name', sans-serif; /* Use the actual font name */
  --font-mono: 'Your Mono Font', monospace;
}
```

**Important Notes:**

- Use the font's **display name** in CSS (e.g., `'Geist'`, `'Architects Daughter'`), not the CSS variable
- The font must be imported in `font.config.ts` for it to be loaded by Next.js
- Font variables from `font.config.ts` are automatically applied to the body via `layout.tsx`
- You can use any Google Font available in `next/font/google`
- Check existing fonts in `font.config.ts` before adding new ones - you might be able to reuse them

**Example:** The `notebook` theme uses `Architects Daughter`:

- Imported in `font.config.ts` as `Architects_Daughter`
- Used in `notebook.css` as `'Architects Daughter'` (with quotes and space)

### Step 6: Set as Default Theme (Optional)

If you want your theme to be the default theme that loads when users first visit the application (without needing the theme switcher), update the default theme constant:

**File:** `src/components/themes/active-theme.tsx`

```typescript
const DEFAULT_THEME = 'your-theme-name'; // Change from 'vercel' to your theme name
```

**Note:** This will make your theme the default for all new users. Existing users who have already selected a theme will still see their saved preference (stored in cookies).

### Step 7: Test Your Theme

1. Start your development server
2. Open the theme selector in the UI
3. Select your new theme
4. Verify it works in both light and dark modes
5. Test scaled variant by selecting "Your Theme Name (Scaled)"
6. If you set it as default, clear your browser cookies and refresh to see it load automatically

## Quick Reference: File Locations

When adding a new theme, you'll work with these files in this order:

1. ✅ `src/styles/themes/your-theme-name.css` - Create theme file with `[data-theme]` attribute
2. ✅ `src/styles/theme.css` - Import your theme file
3. ✅ `src/components/themes/theme.config.ts` - Add theme to `THEMES` array
4. ⚠️ `src/components/themes/font.config.ts` - Add fonts only if needed
5. ⚠️ `src/components/themes/active-theme.tsx` - Set as default only if desired

## Required Tokens

### Minimum Required

At minimum, your theme should define these tokens:

- `--background`
- `--foreground`
- `--card` & `--card-foreground`
- `--popover` & `--popover-foreground`
- `--primary` & `--primary-foreground`
- `--secondary` & `--secondary-foreground`
- `--muted` & `--muted-foreground`
- `--accent` & `--accent-foreground`
- `--destructive` & `--destructive-foreground`
- `--border`
- `--input`
- `--ring`
- `--radius`

### Optional Tokens

These can be omitted if not needed:

- `--chart-1` through `--chart-5` (defaults to primary colors)
- `--sidebar-*` tokens (defaults to card colors)
- `--font-*` tokens (uses system defaults)
- `--shadow-*` tokens (no shadows if omitted)
- `--tracking-normal` (no letter spacing if omitted)
- `--spacing` (uses default)

## Example: Complete Theme

See `src/styles/themes/claude.css` for a complete example with all tokens defined.

## Example: Minimal Theme

For a minimal theme, you can copy an existing theme and modify only the colors you want to change. The system will fall back to defaults for any missing tokens.

## Color Format Reference

### OKLCH Format

```
oklch(lightness chroma hue)
```

- **Lightness**: 0-1 (0 = black, 1 = white)
- **Chroma**: 0+ (0 = grayscale, 0.2+ = colorful)
- **Hue**: 0-360 degrees
  - 0/360 = Red
  - 60 = Yellow
  - 120 = Green
  - 180 = Cyan
  - 240 = Blue
  - 300 = Magenta

### Examples

```css
/* Pure white */
--background: oklch(1 0 0);

/* Pure black */
--foreground: oklch(0 0 0);

/* Bright blue */
--primary: oklch(0.7 0.2 240);

/* Muted gray */
--muted: oklch(0.5 0 0);
```

## Scaled Variants

All themes automatically support scaled variants. When a user selects "Theme Name (Scaled)", the `.theme-scaled` class is applied, which adjusts spacing and text sizes. No additional CSS is needed in your theme file.

## Best Practices

1. **Use descriptive theme names**: Use kebab-case (e.g., `ocean-blue`, `forest-green`)
2. **Provide both light and dark modes**: Always define both variants
3. **Test accessibility**: Ensure sufficient contrast between foreground and background
4. **Keep tokens consistent**: Use similar lightness/chroma values for related colors
5. **Document special features**: If your theme has unique characteristics (like no shadows or custom fonts), add comments

## Troubleshooting

### Theme Not Appearing

- Check that the file is imported in `src/styles/theme.css`
- Verify the theme name matches in both CSS file and theme-selector.tsx
- Ensure the file is saved and the dev server has reloaded

### Colors Not Applying

- Verify all required tokens are defined
- Check that `@theme inline` block includes all color mappings
- Ensure OKLCH format is correct (no typos)

### Dark Mode Not Working

- Verify `.dark` selector is correct: `[data-theme='name'].dark`
- Check that dark mode tokens are defined
- Ensure `next-themes` is properly configured

## Setting a Default Theme

By default, the application uses the `vercel` theme. To change the default theme that loads for new users:

### Method 1: Change Default Constant

Edit `src/components/themes/active-theme.tsx` and update the `DEFAULT_THEME` constant:

```typescript
const DEFAULT_THEME = 'your-theme-name'; // Change this value
```

This will:

- Set your theme as the default for all new users
- Apply when no cookie preference exists
- Still respect user preferences if they've already selected a theme

### Method 2: Server-Side Default (Advanced)

If you want to set a default theme at the server level, you can modify `src/app/layout.tsx` to provide a default value when the cookie doesn't exist:

```typescript
const activeThemeValue =
  cookieStore.get('active_theme')?.value || 'your-theme-name';
```

**Note:** Method 1 is recommended as it's simpler and more maintainable.

## Using Google Fonts in Themes

> **Note:** This section provides additional details about fonts. For the complete step-by-step process, see **Step 5** in the "Step-by-Step Guide" above.

### When to Add Fonts

You only need to add fonts to `font.config.ts` if:

- Your theme uses a Google Font that isn't already imported
- You want to use a custom font that requires loading

**Tip:** Check `src/components/themes/font.config.ts` first - many fonts may already be available!

### Font Loading Process

1. **Import the font** in `src/components/themes/font.config.ts`:

```typescript
import { Roboto, Roboto_Mono } from 'next/font/google';
```

2. **Configure the font** with a CSS variable:

```typescript
const fontRoboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto'
});
```

3. **Add to fontVariables export**:

```typescript
export const fontVariables = cn(
  // ... existing fonts
  fontRoboto.variable
);
```

4. **Use in your theme CSS** with the font's display name:

```css
[data-theme='your-theme'] {
  --font-sans: 'Roboto', sans-serif; /* Use display name, not CSS variable */
  --font-mono: 'Roboto Mono', monospace;
}
```

### Important Notes

- **Font names**: Use the font's display name in CSS (e.g., `'Roboto'`, `'Open Sans'`), not the CSS variable name
- **Font loading**: Fonts must be imported in `font.config.ts` to be loaded by Next.js
- **Automatic application**: Font variables are automatically applied to the body element via `layout.tsx`
- **Available fonts**: Check [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) for available Google Fonts

### Example: Notebook Theme

The `notebook` theme uses `Architects Daughter`:

**In `font.config.ts`:**

```typescript
import { Architects_Daughter } from 'next/font/google';

const fontArchitectsDaughter = Architects_Daughter({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-architects-daughter'
});

export const fontVariables = cn(
  // ... other fonts
  fontArchitectsDaughter.variable
);
```

**In `notebook.css`:**

```css
[data-theme='notebook'] {
  --font-sans: 'Architects Daughter', sans-serif;
}
```

## Reference Files

- **Complete theme example**: `src/styles/themes/claude.css`
- **Theme aggregator**: `src/styles/theme.css`
- **Theme selector component**: `src/components/themes/theme-selector.tsx`
- **Theme provider**: `src/components/themes/active-theme.tsx`
- **Font configuration**: `src/components/themes/font.config.ts`
- **Default theme constant**: `src/components/themes/active-theme.tsx` (line 12)
