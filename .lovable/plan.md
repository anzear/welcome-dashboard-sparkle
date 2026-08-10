# Remove "(any)" from multi-select filter labels

## Change
Drop the "(any)" suffix from the three multi-select filter labels in `src/components/MaterialRegisterTable.tsx` (lines 275, 281, 287):

- `Product (any)` → `Product`
- `Application (any)` → `Application`
- `Tags (any)` → `Tags`

No logic changes — these filters already match on ANY (OR) semantics. Label-only cleanup.
