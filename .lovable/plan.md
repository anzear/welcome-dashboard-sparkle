# Bulk add papers and patents

## Outcome
Super admins can paste or upload up to 200 paper DOIs or patent IDs, review sequential mock lookup results, assign matched nodes in bulk or per row, and create audited records as one traceable batch.

## Implementation
- Add a secondary bulk-add action beside each existing single-record add button.
- Build one reusable four-step dialog for Papers and Patents: Identifiers, Fetch, Nodes, and Result.
- Support paste parsing and first-sheet CSV/XLSX import, including template download, prefix cleanup, duplicate reporting, row preview, and the 200-record limit.
- Run existing mock lookups sequentially at the bulk delay, with progress, cancel-after-current, inline ID correction, duplicate/existing detection, and failed-row retry.
- Reuse the matched-node editor for row assignment and an apply-to-all strip for nodes and notes; show live derived Pathway counts and skip rows without nodes.
- Link valid rows through audited `link_add` changes using a shared batch ID, selected review status, write-time duplicate checks, and null-preserving lookup fields.
- Add linked/skipped/error results, record links, CSV export, summary toast, newest-row ordering, queue updates, and batch-ID search support in Papers, Patents, and Audit Log.

## Technical details
- Extend mock lookup helpers with an optional delay so single add remains unchanged while bulk fetches use 150 ms.
- Keep bulk state isolated in a focused component and share existing node/pathway primitives.
- Generate and parse workbook files with the installed XLSX package; accept semicolon-separated matched nodes.
- Preserve the current in-memory store schema and all existing single-add behavior.

## Verification
- Test mixed pasted input containing valid, malformed, `FAIL`, duplicate, and existing IDs.
- Test template download/upload prefill, apply-to-all behavior, no-node skipping, accepted and review-pending creation, shared audit batch search, working result links, CSV export, queue counts, and table ordering.
- Run type checks, inspect preview diagnostics, and verify both Papers and Patents at 1280px.
