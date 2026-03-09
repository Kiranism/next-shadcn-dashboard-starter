# AI_RULES.md

Execution contract for GPT-5.3, Claude, and other code-generation tools in this repository.

## Mandatory Workflow

1. Understand task and identify impacted feature module.
2. Before creating a new component, ask the user what component they want and request their preferred shadcn reference/snippet when applicable.
3. Search for existing components/hooks/schemas before creating new files.
4. Reuse existing patterns first; create new only with explicit reason.
5. Keep server/client boundaries correct (server by default).
6. Update docs when introducing new behaviors or architecture decisions.

## Non-Negotiable Rules

1. Do not duplicate existing components.
2. Do not put domain logic in `src/components/ui/*`.
3. Do not hardcode visual styles outside design token system.
4. Do not use `any` when a type can be defined.
5. Do not bypass Supabase access patterns defined in feature queries/mutations.
6. Follow `docs/naming-conventions.md` for all symbols, files, and database-facing names.
7. Do not create a new component without explicit user confirmation on component type/spec (or a direct user instruction to proceed).

## File Placement Rules

1. Feature-specific code goes under `src/features/<feature>/`.
2. Shared generic UI belongs in `src/components/shared/`.
3. Primitive UI belongs in `src/components/ui/` only when truly generic.
4. Cross-feature utility goes in `src/lib/` with narrow, typed APIs.

## PR/Change Checklist For AI

Before finishing any change, verify:

1. Existing component reuse was checked (`rg` search completed).
2. New components follow layering rules.
3. Empty/loading/error states are handled.
4. Responsive and keyboard interactions are preserved.
5. TypeScript passes without introducing weaker typing.
6. Related docs were updated if behavior changed.
7. New names are explicit and compliant with naming conventions.

## Supabase-Specific Rules

1. Validate mutation input with Zod before write operations.
2. Keep realtime subscriptions scoped and cleaned up.
3. Handle race/conflict scenarios in assignment workflows.
4. Keep timestamps timezone-safe (store UTC; format at edges).

## Dispatch UX Rules

1. Optimize for minimal clicks and low cognitive load.
2. Preserve consistent status semantics across screens.
3. Prioritize quick actions: assign, reassign, cancel, mark complete.
4. For high-impact actions, include confirmation and clear rollback path.

## Output Discipline

When an AI tool creates new code:

1. Mention files changed.
2. Explain reuse decisions briefly.
3. Call out assumptions.
4. Note any residual risks or missing tests.
