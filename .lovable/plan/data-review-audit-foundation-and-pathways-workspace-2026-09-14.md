# Data Review: audit foundation and Pathways workspace

## Goal
Build the shared append-only audit/revert system, replace the Audit Log placeholder with a complete read-only log, and replace the Pathways placeholder with the full pathway review workflow. The existing Super Admin control-center page remains unchanged.

## 1. Make the HITL store audit-first
- Replace direct entity mutators with one typed `recordChange` path that applies a field change or creates a record, updates actor/timestamps, and appends exactly one immutable audit entry.
- Support pathway, company, company-match, paper/patent-match, and indicator records through shared entity lookup and update helpers kept private to the provider.
- Implement `revertEntry`, including operation-specific handling for updates, links, and creates, always by writing a new `revert` entry rather than editing history.
- Expose `getHistory`, `isSuperseded`, `revertedBy`, and safe record lookup/summary helpers.
- Rework the 15 seed entries so every referenced record exists, each newest audited value matches current seed state, one entry is already reverted, and one earlier entry is superseded.
- Add audited pathway creation support while keeping the store in memory only. No direct array setters will be exposed.

## 2. Add shared audit UI
Under `src/components/hitl/`:
- Add `OperationChip` and `ValueDiff`, preserving strict null-versus-zero rendering and compact JSON previews.
- Add a global history-sheet provider/hook and one mounted `RecordHistorySheet` that any Data Review section can open by entity type and ID.
- Show newest-first history, summaries, actor/time, operation, field, diff, note, trace, reverted/superseded markers, linked revert targets, and confirmation flows.
- Keep the sheet open after revert, surface the new entry immediately, and show the requested toast.

## 3. Build the Audit Log section
- Add a dedicated `AuditLogSection` using the existing Super Admin table-card language.
- Implement text, entity, operation, actor, and date-range filters; reset; newest-first sorting; 25-row pagination; and current-filter CSV export.
- Make record IDs open the shared history sheet.
- Add amber/grey row markers for revert and reverted entries, with no edit/delete controls.
- Add the development-only random indicator update action using `recordChange` and a fresh fake trace ID.

## 4. Build the Pathways table and actions
- Add a dedicated `PathwaysSection` with search, status/group filters, deleted-row toggle, exact requested columns, live selection, row actions, and the sticky bulk action bar.
- Wire History to the shared sheet and make every status, group, visibility, node, and attached-record update use `recordChange`.
- Add shared status/visibility and assign-group dialogs for row actions, selected pathways, and bulk deactivation by Feedstock, Product, or Application/Market.
- Derive organisation options from the same organisation names represented by existing User Management data.

## 5. Add pathway create and edit flows
- Build reusable node combobox fields with existing-value options, “Create new node” choices, badges, and the required confirmation checkbox.
- Add New Pathway with case-insensitive trimmed duplicate detection, row highlighting, audited creation, and the mock queue toast.
- Add Edit Pathway with direct audited group updates when nodes are unchanged.
- When nodes change, show the consequences step, attached-record counts, the three requested handling choices, and audited updates to each affected record.

## 6. Add Excel import
- Add the `xlsx` client library and an import dialog for `.xlsx` files.
- Generate the requested one-sheet template, parse the first sheet, preview validation outcomes, flag new nodes, and skip missing/duplicate rows exactly as specified.
- Import only valid rows as audited `needs_approval` pathway creates and report imported/skipped/error totals.

## 7. Integrate and validate
- Replace only the Pathways and Audit Log placeholders; retain the other three placeholders.
- Remove the development chip-preview strip from Pathways.
- Keep all four review-queue counts derived live from store state.
- Verify filtering, pagination, CSV download, history opening, normal and superseded revert paths, already-reverted state, creation/duplicate handling, node-change consequences, status/visibility/group bulk actions, Excel preview/import, and audit-log propagation.
- Check the live preview at desktop and narrower widths, confirm no runtime errors, and confirm the existing Super Admin page and tabs are unchanged.
