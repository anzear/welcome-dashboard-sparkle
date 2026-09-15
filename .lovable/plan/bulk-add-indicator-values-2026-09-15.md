# Bulk add indicator values

## Build
- Replace the Indicators add action with the shared split button for single entry, bulk entry, and template download.
- Add a three-step bulk dialog: paste/upload rows, review valid rows, then show exportable results.
- Parse up to 200 rows, match indicator labels case-insensitively, normalize targets to each indicator scope, deduplicate by indicator and target, and show inline errors or ignored-position warnings.
- In review, support editable values and metadata, per-row existing-record behavior, apply-to-all controls, affected Pathway counts, and review-pending creation.
- Write new records and existing-record corrections through audited store changes with one shared batch ID, preserving zero versus null and uniqueness.
- Keep created and corrected rows prominent, searchable by batch ID, linked from results, and represented in pending queues and Audit Log.

## Technical details
- Reuse `SplitAddButton`, indicator target helpers, `ScopeChip`, `TargetRef`, and `recordChange`.
- Generate and parse `.xlsx`/`.csv` locally with the existing XLSX package; make no server calls.
- Add a per-record batch identifier field so table and Audit Log search can resolve the complete run without changing existing audit field names.
- Verify mixed paste validation, existing correction, creation, result export/linking, batch search, pending queue updates, and no runtime errors.
