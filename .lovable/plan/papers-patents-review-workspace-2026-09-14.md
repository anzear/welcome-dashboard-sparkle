# Papers & Patents review workspace

## Goal
Replace the Papers & Patents placeholder with an audited match-review table, local DOI/patent lookup flow, Pathway reassignment, and full record details. Keep every write on `recordChange` and leave the other Data Review sections unchanged.

## 1. Extend evidence records and local lookup
- Add nullable `year`, `authors_or_assignee`, `abstract`, and `source` fields to `PaperPatentMatch`.
- Backfill seed papers and patents with plausible publication/assignee details while deliberately retaining some null fields.
- Create `src/lib/mockLookup.ts` with 600 ms DOI and patent lookups, exact format validation, explicit `FAIL` errors, and deterministic bioeconomy-oriented mock results.

## 2. Build the matches table
- Add search plus Kind, Status, and Pathway filters.
- Sort review-pending matches first, then newest `matched_at`.
- Render the requested kind, title, external ID link, Pathway tooltip, dates, status, note, trace, and action columns with null-safe cells.
- Add row selection and the sticky Accept / Reject / Clear selection bar.
- Keep rejected rows visible and filterable.

## 3. Share audited decisions
- Add one single/bulk Accept / Reject dialog with a match summary, optional note, and the rejection retention message.
- Write one `accept` or `reject` status audit entry per selected match.
- Reuse the same dialog from the table and detail sheet, with the matching confirmation toast and live queue updates.

## 4. Add Pathway reassignment
- Reuse the searchable eligible-Pathway selector pattern from Companies.
- Block an external ID already linked to the target Pathway and provide a History action for that existing match.
- On confirmation, audit the `pathway_id` change, then audit-reset status to `review_pending` with the required note and toast.

## 5. Add paper/patent lookup and linking
- Open one dialog from either “Add paper by DOI” or “Add patent by ID”, presetting the kind.
- Implement idle, 600 ms fetching, inline validation/not-found errors, Retry, and a successful preview with source, year, authors/assignee, and expandable abstract.
- Enable the link step only after a successful fetch; collect an eligible Pathway and optional note.
- Block duplicate external-ID/Pathway links; otherwise create an accepted `PaperPatentMatch` through `recordChange` using `link_add`, null trace ID, and the requested toast.

## 6. Build the match detail sheet
- Show kind, title, linked external ID, source, status, nullable record fields, full Pathway nodes, absolute dates, note, and trace.
- Add shared Accept, Reject, and Reassign actions.
- Embed `RecordHistoryList` for complete history and revert behavior.

## 7. Integrate and validate
- Replace only the Papers & Patents placeholder and keep all labels as “Pathway”.
- Verify filters, default sort, bulk decisions, queue-count updates, Audit Log entries, History/revert, duplicate reassignment and linking blocks, malformed/FAIL lookup errors, successful lookup/linking, external links, and null rendering.
- Check the live page at desktop and narrower widths and confirm no runtime or build errors.
