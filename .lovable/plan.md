# Papers and Patents: position-specific nodes

## Outcome
Paper and patent evidence will use four optional, labelled positions—Feedstock, Process, Product, and Application—instead of an untyped list. Pathway derivation will require exact matches at every filled position, while records with no nodes remain valid and reviewable.

## Implementation
1. **Data model and migration**
   - Replace `matched_nodes` with a four-field `nodes` object and add position-aware helpers for filled positions, no-node detection, pathway derivation, and Production/Application scope.
   - Migrate seed values using pathway frequency, spine-order tie-breaking, and the next valid free position.
   - Extend audited nested-field reads and writes for `nodes.<position>` and remove `matched_nodes` from evidence audit paths.

2. **Shared node controls and displays**
   - Replace free-value chips with labelled `NodeChips`, including expandable compact overflow and the amber “No nodes” state.
   - Add reusable `NodeFields` with four optional, position-specific autocomplete inputs, unknown-value badges, clear controls, and live derived-pathway counts.
   - Update pathway lists and scope explanations to use filled positions and full centralized labels.

3. **Review tables and detail flows**
   - Update Papers and Patents tables, searching, sorting, global Feedstock/Product filtering, and the new Nodes filter.
   - Show the four-position set/not-set grid in detail sheets.
   - Update decision dialogs, Edit nodes, single DOI/ID linking, history, Audit Log, and trace views; allow saving or linking records with zero nodes.

4. **Bulk add**
   - Parse `ID; feedstock; process; product; application`, require the new six-column upload template, and show an inline missing-header error for legacy/invalid files.
   - Use compact per-row `NodeFields`; add per-position apply checkboxes so untouched positions are preserved.
   - Link zero-node rows, distinguish them as “Linked · no nodes”, and report them in the Continue count and exported results.

5. **Verification**
   - Validate both evidence types across seeded rows, no-node filtering/sorting, detail and edit states, single add, bulk paste/upload/apply, pathway derivation/scope, shared batch audit entries, history/trace rendering, and global node filters.
   - Confirm type safety, preview build health, horizontal table behavior, and a clean browser console.

## Technical details
- Keep existing pathway store keys (`process_technology`, `application_market`) while the evidence `nodes` object follows the requested public keys (`feedstock`, `process`, `product`, `application`).
- Map evidence positions to pathway keys centrally and compare normalized trimmed values case-insensitively.
- Keep all mutations append-only through `recordChange`; edits emit one update per changed `nodes.<position>` field.
- No network or backend changes.
