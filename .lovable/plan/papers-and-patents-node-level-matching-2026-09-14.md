# Papers and Patents node-level matching

## Scope
- Replace visible single-Pathway assignment for Papers and Patents with matched spine nodes and a production/application scope.
- Derive all related non-deleted Pathways from matched node values without changing server data.
- Preserve existing review decisions, history, trace, null handling, and append-only audit behavior.

## Implementation
1. Extend the local evidence-match model with nullable node fields and scope, migrate seeded records, support nested `nodes.*` audited fields, and expose a shared derived-Pathway helper.
2. Add shared `ScopeChip`, `NodeChips`, and `DerivedPathways` components, including expanded `PathwayRef` multi-node emphasis.
3. Rebuild Papers and Patents tables with Scope, Nodes, and derived Pathways columns; add scope/count sorting, scope filtering, node search, and derived-aware global filters.
4. Rebuild detail sheets and replace Reassign Pathway with an Edit nodes dialog featuring optional autocomplete fields, new-node markers, validation, live derived results, and one audit entry per changed field.
5. Update Add by DOI/ID to select nodes and scope, block duplicate records by external ID, and create an accepted linked record with node/scope snapshots.
6. Update Audit Log, record history, and trace summaries to show title, scope, node chips, and derived Pathway counts for papers and patents.
7. Verify Papers and Patents interactions, filtering, sorting, edit/add audit entries, history/trace summaries, responsive layout, console state, and build output.

## Technical details
- Node matching is trimmed and case-insensitive; all non-null matched positions must match a Pathway.
- Records with no derived Pathway remain valid; at least one matched node is required for edits and additions.
- Existing `pathway_id` remains on the client-side type only and is not rendered or modified by the new workflows.
- Saves emit `recordChange` calls for `nodes.feedstock`, `nodes.process_technology`, `nodes.product`, `nodes.application_market`, and `scope` only when each value changed.
