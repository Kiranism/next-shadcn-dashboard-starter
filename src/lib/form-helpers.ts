/**
 * form-helpers.ts — schema/server utilities for the form system.
 * See docs/forms.md ("Deriving field validators" and "Server errors").
 */

import type { ZodTypeAny } from 'zod';

/**
 * Minimal structural view of a form instance — accepts ANY concrete
 * FormApi/useAppForm instance (AnyFormApi's giant generics make concrete
 * instances non-assignable to it; method syntax keeps params bivariant).
 */
export interface ServerErrorHost {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFieldMeta(field: any, updater: any): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setErrorMap(errorMap: any): void;
  readonly state: { readonly fieldMeta: object; readonly errors: unknown[] };
}

/* oxlint-disable typescript/no-explicit-any --
   Zod schema traversal is inherently untyped (the path is a runtime string);
   the RESULT is used as a validator, where StandardSchemaV1 typing applies
   at the usage site. */

/** Wrapper kinds whose `.unwrap()` yields "the same value, less wrapping".
 *  Deliberately EXCLUDES 'array' — in Zod v4 ZodArray.unwrap() returns the
 *  ELEMENT, which is a traversal step (handled below), not an unwrap. */
const WRAPPER_TYPES = new Set(['optional', 'nullable', 'default', 'readonly', 'catch']);

function unwrapSchema(schema: any): any {
  if (!schema) return schema;
  const kind = schema.def?.type;
  if (!WRAPPER_TYPES.has(kind)) return schema;
  const inner =
    typeof schema.unwrap === 'function'
      ? schema.unwrap()
      : typeof schema.removeDefault === 'function'
        ? schema.removeDefault()
        : schema.def?.innerType;
  if (!inner || inner === schema) return schema;
  return unwrapSchema(inner);
}

/**
 * Picks the sub-schema for a field path out of a Zod OBJECT schema, so
 * field-level validators can be DERIVED from the single source of truth
 * instead of restating every rule:
 *
 * @example
 * ```tsx
 * <FormTextField name='contact.email' label='Email'
 *   validators={{ onBlur: schemaFor(orgSchema, 'contact.email') }} />
 * ```
 *
 * Supports dot paths, array element paths ('items[0].name' resolves the
 * element schema), and unwraps optional/nullable/default wrappers along the
 * way. Returns undefined when the path doesn't resolve (e.g. through a
 * union or a refine-wrapped object) — passing undefined as a validator is a
 * no-op, so this degrades safely; keep explicit validators for those paths.
 */
export function schemaFor(schema: ZodTypeAny, path: string): ZodTypeAny | undefined {
  const segments = path
    .replace(/\[\d*\]/g, '.__element__')
    .split('.')
    .filter(Boolean);

  let current: any = schema;
  for (const segment of segments) {
    current = unwrapSchema(current);
    if (!current) return undefined;
    if (segment === '__element__') {
      current = current.element;
      continue;
    }
    current = current.shape?.[segment];
  }
  return unwrapSchema(current);
}

export interface ServerErrors {
  /** Form-level messages (shown by <FormErrors /> after the submit). */
  formErrors?: string[];
  /** Per-field messages, keyed by field path — rendered at each field. */
  fieldErrors?: Record<string, string | string[]>;
}

/**
 * Maps a failed mutation's error payload (e.g. a 409 "email already taken")
 * back onto the form: field messages render at their fields (marked touched
 * so they display), form-level messages render in <FormErrors />.
 *
 * Call from your mutation's onError. The errors live under the 'onServer'
 * error-map key: they persist until the next applyServerErrors call, a
 * clearServerErrors call, or form.reset() — editing a field does NOT clear
 * its server error automatically (clear in a listener if you want that).
 *
 * @example
 * ```tsx
 * const mutation = useMutation({
 *   mutationFn: createUser,
 *   onError: (e) => applyServerErrors(form, {
 *     fieldErrors: { email: 'This email is already registered' }
 *   })
 * });
 * ```
 */
export function applyServerErrors(form: ServerErrorHost, errors: ServerErrors) {
  for (const [name, raw] of Object.entries(errors.fieldErrors ?? {})) {
    const message = (Array.isArray(raw) ? raw : [raw]).join(' ');
    // meta can be undefined for a field that never mounted — build it fresh.
    form.setFieldMeta(name as never, (meta: any) => ({
      ...meta,
      isTouched: true,
      errorMap: { ...meta?.errorMap, onServer: message }
    }));
  }
  if (errors.formErrors?.length) {
    form.setErrorMap({ onServer: errors.formErrors.join(' ') });
  }
}

/** Removes all server errors previously applied via applyServerErrors. */
export function clearServerErrors(form: ServerErrorHost) {
  for (const name of Object.keys(form.state.fieldMeta)) {
    form.setFieldMeta(name as never, (meta: any) => {
      if (meta?.errorMap?.onServer === undefined) return meta;
      const { onServer: _drop, ...rest } = meta.errorMap;
      return { ...meta, errorMap: rest };
    });
  }
  form.setErrorMap({ onServer: undefined });
}
/* oxlint-enable typescript/no-explicit-any */
