/**
 * Thin re-export shim.
 *
 * The Kanban board has been split into the kanban/ folder alongside this file.
 * This shim preserves the original import path used by trips-listing.tsx
 * so no other files need to be updated.
 *
 * @see ./kanban/kanban-board.tsx  – main orchestrator
 * @see ./kanban/                  – all sub-components and utilities
 */

export { TripsKanbanBoard } from './kanban';
