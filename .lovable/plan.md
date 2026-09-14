# Papers and Patents: node values and per-Pathway scope

## What will change

- Replace each paper or patent’s position-keyed node object and stored scope with a deduplicated `matched_nodes` value array.
- Derive matching Pathways by finding every non-deleted Pathway containing all selected values in any spine position.
- Compute Production and Application independently for every derived Pathway, allowing one Pathway to carry both scopes.
- Preserve the existing client-only prototype, audit model, review decisions, lookup behavior, and status handling.

## Shared displays

- Add node-value chips ordered by each value’s most common spine position, with full-position tooltip counts and an expandable compact overflow.
- Add per-Pathway Production/Application chips, aggregate scope summaries, and a derived-Pathway popover sorted production-only, both, then application-only.
- Extend Pathway references so matching values are bold wherever they occur, independent of spine position.
- Render `matched_nodes` audit changes as comma-separated values rather than raw arrays.

## Papers and Patents workspace

- Rebuild both tables with Matched nodes, Pathways, and computed Scope columns.
- Replace the scope filter with Production in any Pathway, Application in any Pathway, Both in the same Pathway, and No derived Pathway.
- Keep node-value search and make global Feedstock/Product filters pass on a direct selected value or any matching derived Pathway.
- Rebuild detail sheets around full value chips and Pathways grouped by Production, Application, and Both, including position-based explanations.

## Editing and adding

- Replace the four positioned inputs and scope selector with one multi-value node picker backed by all live Pathway values.
- Support autocomplete metadata, canonical casing, free-text “New node” values, chip removal, one-to-four distinct values, and a one-value minimum.
- Show a live derived-Pathway preview and computed scope summary.
- Save edits as one audited `matched_nodes` update plus an optional note update; create new linked records with `matched_nodes` in the `link_add` snapshot.

## Cross-section updates

- Update queue filtering, Pathway change consequences, Audit Log, record history, and trace records to use node values and computed scopes.
- Remove all paper/patent uses of record-level `scope`, positioned evidence `nodes`, and the old Scope chip.

## Verification

- Verify both Papers and Patents tables, all scope filters, global Feedstock/Product filtering, Pathway popovers, detail grouping and explanations, node editing, new-record linking, audit history, trace summaries, and Pathway consequence re-derivation.
- Confirm only `matched_nodes` is written for node edits, no record-level scope remains, no runtime errors occur, and the latest build passes.
