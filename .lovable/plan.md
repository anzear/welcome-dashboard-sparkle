# Audit Log row and bulk revert

## Build
- Add selection checkboxes and a sticky right-side Actions column to Audit Log, with History and Undo icon buttons on every row.
- Reuse the store’s existing `revertEntry`, `isSuperseded`, and `revertedBy` behavior for single-row confirmation, superseded warnings, disabled reverted entries, immediate row styling, and success messages.
- Add the conditional bulk bar and a bulk confirmation dialog that classifies selected entries, requires acknowledgement for superseded changes, skips already reverted entries, and processes eligible entries newest-first.
- Reuse the Audit Log entity-summary presentation inside single and bulk confirmations, while preserving null-versus-zero value rendering.
- Expand the central field-label map for status, corrected values, visibility, registry/group/role fields, and all nested node positions; apply it consistently in Audit Log and History.
- Correct inconsistent seeded audit operations and ensure seeded create/link entries use complete record snapshots with null fields and prior values.

## Verification
- Check normal, superseded, already-reverted, and revert-of-revert row states.
- Check mixed-state bulk revert, ordering, counts, selection clearing, and newly inserted top rows.
- Confirm History opens from Audit Log actions, field labels are human-readable, and no edit/delete actions appear.
- Run TypeScript/build checks and a live browser flow with no console errors.
