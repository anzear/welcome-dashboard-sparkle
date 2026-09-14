# Split Papers and Patents review sections

## Goal
Replace the combined Papers & Patents workspace with separate Papers and Patents sections while keeping one reusable review implementation, independent live queues, kind-specific audit history, and the existing interaction patterns.

## 1. Split navigation and live queues
- Change the Data Review section values to `pathways`, `companies`, `papers`, `patents`, `indicators`, and `audit`.
- Redirect the legacy `papers-patents` query value to `papers`; continue defaulting unknown or missing values to `pathways`.
- Replace the combined queue card with Paper and Patent pending cards, each filtered by kind and `review_pending` status.
- Lay five cards in one row at wide widths and allow the existing responsive grid to wrap below that width.
- Route each new tab and queue card to its own kind-specific view.

## 2. Migrate the store and audit types
- Replace `paper_patent_match` in `AuditEntityType` with `paper_match` and `patent_match`.
- Add `paperMatches()` and `patentMatches()` selectors over the shared `PaperPatentMatch[]` array.
- Migrate seeded audit entries according to the referenced record's kind.
- Make record lookup, mutation, revert, history, supersession, and audit behavior support both new entity types while still updating the single shared array.
- Ensure every new accept, reject, reassign, status reset, link creation, and revert writes the correct kind-specific entity type.

## 3. Build one shared kind-driven review component
- Replace `PapersPatentsSection` with `MatchReviewSection({ kind })`; reuse one table, decision dialog, reassignment dialog, add dialog, and detail sheet.
- Filter rows by the fixed kind internally and remove the Kind filter and Kind column.
- Preserve search, Status and Pathway filters, pending-first sorting, bulk actions, History, duplicate checks, and local mock lookup behavior.
- Give Papers the DOI, Authors, and Year columns plus the sole `Add paper by DOI` action.
- Give Patents the Patent ID, Assignee, and Year columns plus the sole `Add patent by ID` action.
- Keep missing authors, assignee, and year as em dashes through `ValueCell`.

## 4. Specialize add and detail flows
- Lock each add dialog to its section kind with no kind toggle.
- Papers use `lookupDoi`, create `kind: paper`, use the Semantic Scholar source label, and write `paper_match` audit entries.
- Patents use `lookupPatent`, create `kind: patent`, use the USPTO source label, and write `patent_match` audit entries.
- Keep the current fetch, error, retry, preview, Pathway selection, note, duplicate blocking, and toast patterns.
- Make each detail sheet show the fixed source chip and the correct Authors or Assignee label, with History using the correct entity type.

## 5. Update shared history, audit, and trace integrations
- Add Paper match and Patent match labels to Record History and the Audit Log filter.
- Ensure existing seeded entries appear under their migrated labels and cross-links open the correct history.
- Split Trace sheet record mapping into Paper match and Patent match chips while retaining Paper matcher and Patent matcher chains.
- Preserve all decision counting, trace cross-links, and record summaries.

## 6. Remove legacy combined references and validate
- Remove the combined section component and every code reference to `Papers & Patents`, `paper_patent_match`, and `papers-patents`; retain the old query string only as the explicit redirect check.
- Verify six tabs, five responsive queue cards, separate pending counts, and card navigation.
- Verify paper and patent tables have their exact requested columns and no Kind controls.
- Verify both add flows, decisions, reassignment, detail sheets, History, Audit Log filtering, Trace sheet entity chips, null rendering, and live queue changes.
- Check narrow and wide layouts, runtime diagnostics, and build output.
