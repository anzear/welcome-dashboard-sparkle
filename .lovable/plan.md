# Prompt 29 — Remove all trace UI

## Goal
Remove all trace-related UI and supporting presentation infrastructure from Data Review while preserving trace_id fields, seed values, and development-helper writes.

## Implementation
- Remove the Trace sheet/provider/hook, TraceId primitive, and mock trace registry.
- Remove trace columns, rows, labels, tooltips, detail references, and Audit Log trace filtering.
- Keep trace_id on records and audit entries, including current seed data and mutation writes.
- Rebalance table columns naturally while keeping Actions right-aligned and preserving narrow-layout scrolling.

## Validation
- Search for remaining trace UI references and confirm only data fields/writes remain.
- Verify TypeScript/build diagnostics and exercise Data Review plus the Audit Log development helper.
