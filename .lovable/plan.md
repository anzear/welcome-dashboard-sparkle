# Standalone pathway visibility

## Build
- Add one reusable Set visibility dialog for a single pathway or a selection, including organisation selection, validation, current-state summaries, Replace/Add/Remove modes, notes, change previews, and audited `visibility_scope` updates.
- Add visibility entry points to each row, the selection bar, the Visibility table cell, and the edit-pathway dialog.
- Add a Bulk set visibility by node dialog for Feedstock, Process, Product, or Application matches, with the shared controls and a collapsible current-visibility preview.
- Remove visibility editing from status dialogs and bulk deactivation so status and visibility never change each other; provide the requested handoff link after status saving.
- Add the Visibility filter for All users, selected organisations, and each organisation.

## Technical details
- Normalize empty selected-organisation lists to `"all"` and skip unchanged records.
- Implement merge semantics per pathway: Replace sets the exact scope, Add unions selected organisations while preserving `"all"`, and Remove subtracts with empty lists falling back to `"all"`.
- Write one `recordChange` update on `visibility_scope` per changed pathway, preserving the optional note.
- Display organisation user counts from the existing Super Admin user fixture and keep all changes client-side.

## Verify
- Exercise single, selection, and by-node entry points plus Replace/Add/Remove behavior.
- Confirm filtering, validation, status independence, audit rows, tooltips, and no console errors.