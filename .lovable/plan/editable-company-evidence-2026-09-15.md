# Editable company evidence

## Goal
Make company evidence editable from every company node-assignment and profile entry point, while preserving one nullable free-text value and auditing every change.

## Implementation
- Extend the shared node editor with a three-row Evidence textarea, prefilled for edits and empty for new companies.
- Include `evidence` in Edit nodes audited changes, normalizing blank input to `null`.
- Keep single-add fallback behavior as `Added manually` when evidence is blank; leave the existing bulk Evidence column and template unchanged.
- Make the table Evidence cell open Edit nodes focused on Evidence.
- Show evidence in the company sheet header with an inline pencil shortcut focused on Evidence.
- Add Evidence to the Profile field table using the existing inline edit, optional note, and clear-to-null flow.
- Show current evidence read-only in Accept and Reject confirmations.

## Technical details
- Add optional focus state to the Edit nodes dialog and focus the Evidence textarea when opened from evidence-specific shortcuts.
- Route every edit through `recordChange` with `field: "evidence"`, `operation: "update"`, and normalized `string | null` values.
- Preserve the existing company schema, history, audit, bulk-add workflow, and Pathway terminology.

## Validation
- Verify table, sheet header, profile row, Edit nodes, single-add, and decision-dialog evidence behavior.
- Confirm clearing stores null, unchanged evidence creates no audit entry, and changed evidence appears in History and Audit Log.
- Check TypeScript, build diagnostics, and live Data Review interactions.
