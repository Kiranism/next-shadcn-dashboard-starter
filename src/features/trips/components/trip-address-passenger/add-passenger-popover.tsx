'use client';

/**
 * @deprecated Prefer `AddPassengerInline` with `variant="first" | "additional"`.
 * Popover UI was removed; this wrapper maps old call sites to the additional (collapsible) flow only.
 */
import {
  AddPassengerInline,
  type AddPassengerInlineProps
} from './add-passenger-inline';

export function AddPassengerPopover(
  props: Omit<AddPassengerInlineProps, 'variant'>
) {
  return <AddPassengerInline {...props} variant='additional' />;
}
