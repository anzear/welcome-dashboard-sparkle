# Rename company Evidence to Relevance

## Summary
Rename every user-facing company label from “Evidence” to “Relevance” while preserving the stored `evidence` field, existing values, audit payloads, and creation defaults.

## Implementation
- Add and export `FIELD_LABELS` in the review store with `evidence: "Relevance"`; leave the company schema, seed records, and all `recordChange` field names unchanged.
- Use the field-label mapping for History row headings, revert confirmation text, and the Audit Log Field column so company `evidence` changes display as “Relevance”. Keep raw field names in stored audit entries and CSV data unless they are rendered as a visible label.
- Update Companies UI copy:
  - table column and evidence-cell accessibility label
  - Edit nodes and Add company field label, placeholder, and focused-edit naming
  - company sheet header and Profile row label/editor placeholder
  - Accept/Reject review caption
- Update Bulk Add Companies:
  - Nodes/upload preview headers, apply-to-all label/button, and row input labels
  - downloaded template header to `Relevance`
  - spreadsheet import reads `Relevance` first and falls back to legacy `Evidence`
- Preserve company search behavior so relevance text remains searchable; only user-facing wording changes.

## Verification
- Search Companies UI and template code for remaining user-visible “Evidence” strings, excluding the internal `evidence` key and unrelated Papers/Patents concepts.
- Verify single add/edit, company sheet, review dialog, table, bulk workflow, and template download all show “Relevance”.
- Import a workbook using the legacy `Evidence` header and confirm its value still appears under Relevance.
- Edit relevance and confirm History and Audit Log show the field label “Relevance” with prior → new values.
- Run TypeScript checks and confirm the latest preview build succeeds without browser errors.
