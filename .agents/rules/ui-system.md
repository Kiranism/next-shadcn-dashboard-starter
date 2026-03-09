# UI System Rules

This file locks global behavior and design decisions for consistency.

## Design Objectives

- Fast operational scanning
- Low-click trip creation and assignment
- Visual consistency across all dispatcher screens

## Global Tokens Only

1. Use semantic tokens from theme CSS variables.
2. Do not hardcode colors in feature code.
3. Spacing follows one scale only (`4, 8, 12, 16, 24, 32`).
4. Borders/radius/shadows must use existing design tokens/utilities.

## Typography Rules

1. Typography is global; no per-page font overrides.
2. Use a fixed hierarchy for operational readability:
   - Page title
   - Section title
   - Table header
   - Body
   - Meta/caption
3. Minimum body size for dense tables should stay readable for long sessions.

## Interaction Rules (Must Stay Consistent)

1. Tables
   - Sticky header for long datasets
   - Column sorting/filtering behavior consistent across modules
   - Status colors and badge semantics consistent everywhere
2. Forms
   - Inline validation + clear error copy
   - Submit button disabled only when invalid/submitting
   - Destructive actions always require confirmation
3. Modals/Drawers
   - Same close behavior (`Esc`, overlay click where appropriate)
   - Preserve unsaved warning for critical forms
4. Notifications
   - Success/failure tone and placement consistent

## Accessibility Baseline

1. Keyboard-accessible for all dispatch-critical actions.
2. Visible focus ring on all interactive elements.
3. Color is never the only status signal (icon/text required).
4. Respect reduced-motion preferences.

## Responsive Rules

1. Desktop first for dispatcher use, but must remain fully functional on tablet.
2. On smaller screens, prioritize trip queue and assignment actions over secondary panels.
3. Avoid horizontal overflow in action-heavy tables by defining responsive column priorities.

## Empty/Error/Loading States

1. Empty state always explains next action.
2. Error state includes retry affordance.
3. Loading state uses skeletons consistent with final layout.
