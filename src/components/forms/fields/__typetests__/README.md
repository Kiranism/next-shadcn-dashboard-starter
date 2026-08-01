# Form-system type tests (self-verifying)

Compile-time probe suite for the typed composition layer
(`useFormFields(form)` / `bindFieldComponent` / `StrictDeepKeysOfType` in
`src/components/ui/form-context.tsx`). No test runner involved — **a clean
`bun run typecheck` (tsc) run IS the passing suite**, via a two-sided oracle:

- Every **must-be-a-compile-error** probe sits under `// @ts-expect-error`.
  If a future change makes the bad code compile (a type-safety regression),
  TypeScript reports **TS2578 "Unused @ts-expect-error"** and typecheck fails.
- Every **must-keep-compiling** probe is plain code. If a change rejects a
  legitimate pattern, typecheck fails with a normal error.

| File | Covers |
| --- | --- |
| `probes-a.tsx` | A1–A9: value-type mismatches, wrong-typed validators, `defaultValue`, `onChangeListenTo` typos, atomic-leaf sub-path rejections (`attachments[0].name`) |
| `probes-r.tsx` | R-regressions: optional paths, template-literal array paths, number paths, typed validator functions, File/Date whole-value binding, custom branded field joining |
| `union-form.tsx` + `union-strict-probes.tsx` | Discriminated-union `TFormData` works; cross-branch type conflicts rejected for single-type widgets (`StrictDeepKeysOfType`) |
| `composed-fields.tsx` | Group/array widgets (`FormCheckboxGroupField`, `FormArrayTextField`), shared prop surface (orientation/disabled/rich radio options), literal-union write guards, `schemaFor`/`applyServerErrors` helpers, extras collision guard |
| `enterprise-form.tsx` (+ `org-settings*.ts`) | 23-field, 3-level nested shape compiles — the tsc-perf canary |
| `mechanics.ts` | Type-level assertions on the atomic-exclusion machinery |
| `augment-test.tsx` | `AtomicFieldValues` declaration-merge extensibility |
| `edge-limits.tsx` | Documented boundaries: open `Record` keys, recursive-type TS2589 (upstream), `as` vs `satisfies` for defaults |
| `date-picker-field.tsx` | Fixture: feature-local custom field via `fieldFor` |

These files ship no runtime code into the app (nothing imports them). The
runtime half of the contract (prop forwarding through the centralized cast,
instance binding, nested-form isolation) is covered by
`bun scripts/smoke-form-binding.tsx`.

Guard note: never constrain a field's `name` with an intersection of two path
unions (`DeepKeysOfType<T, V> & DeepKeys<T>`) — it triggers a template-literal
cross-pair artifact in error messages. `StrictDeepKeysOfType` alone is both
correct and clean.
