# Roadmap

- [x] Prompt 2: append-only audit and revert mechanism
- [x] Prompt 2: shared history sheet and Audit Log section
- [x] Prompt 3: Pathways table and audited actions
- [x] Prompt 3: create/edit/status/group/import workflows
- [x] Validate live preview and interactions
- [x] Prompt 4: Companies match review and decisions
- [x] Prompt 4: Company profiles and audited editing
- [x] Prompt 4: Add company to pathway workflow
- [x] Prompt 4: Validate live interactions and queue updates
- [x] Prompt 5: Papers & Patents match review and decisions
- [x] Prompt 5: Reassignment, mock lookup and linking
- [x] Prompt 5: Detail sheet with actions and history
- [x] Prompt 5: Validate live interactions and queue updates
- [x] Prompt 6: Indicator display rules, staleness and seed corrections
- [x] Prompt 6: Flat and grouped indicator review tables
- [x] Prompt 6: Audited accept, reject, correct and clear workflows
- [x] Prompt 6: Validate history, queue updates and null/zero behavior
- [x] Prompt 7: Mock LLM trace registry with deterministic fallback
- [x] Prompt 7: Global clickable Trace sheet and cross-linked records
- [x] Prompt 7: Audit Trace filter and complete trace surfaces
- [x] Prompt 7: Validate known, unknown and human-created traces
- [x] Prompt 8: Split navigation and live review queues into Papers and Patents
- [x] Prompt 8: Migrate audit entity types and shared store selectors
- [x] Prompt 8: Refactor the combined review UI into one kind-driven component
- [x] Prompt 8: Update history, Audit Log and Trace sheet integrations
- [x] Prompt 8: Remove legacy combined references and validate both flows
- [x] Prompt 9: Make Pathway node fields free-text with autocomplete
- [x] Prompt 9: Add Required and New node states with case-normalization
- [x] Prompt 9: Preserve duplicate checks, consequences and import badges
- [x] Prompt 9: Validate new, existing and empty node input behavior
- [x] Prompt 10: Add URL-persisted Feedstock and Product filter context and bar
- [x] Prompt 10: Filter six sections, queue counts and dependent Pathway options
- [x] Prompt 10: Add filtered profile counts, audit resolution and empty states
- [x] Prompt 10: Clear bulk selections on global filter changes
- [x] Prompt 10: Validate persistence, dependent options and all section results
## Prompt 11 — Pathway references and company role nodes
- [x] Add shared PathwayRef and roleNode helper
- [x] Update Companies match table and profile sheet
- [x] Update Papers, Patents, Indicators, Audit, History, Trace
- [x] Update pathway selectors and consequences comparison
- [x] Expand node-value search and verify UI/build
## Prompt 12 — Papers and Patents node-level matching
- [x] Extend evidence records with nodes, scope and derived Pathways
- [x] Add shared scope, node and derived Pathway displays
- [x] Rebuild tables, detail sheets and filters
- [x] Replace reassignment and add flows with node selection
- [x] Update audit, history and trace summaries
- [x] Verify interactions and build

## Prompt 13 — Companies node assignment and fit
 - [x] Migrate company records, audit entities and derived-fit helpers
 - [x] Add shared company role, secondary-node, fit and derived-Pathway displays
 - [x] Rebuild the Companies table, decisions and company sheet
 - [x] Add audited node editing and company creation flows
 - [x] Update queues, audit/history/trace summaries and Pathway consequences
 - [x] Remove legacy company-match UI/store references and verify interactions

## Prompt 14 — Evidence node values and per-Pathway scope
- [x] Migrate paper and patent records from positioned nodes and stored scope to matched node values
- [x] Add value metadata, derived Pathway scope helpers, and value-based Pathway emphasis
- [x] Rebuild shared evidence chips, summaries, Pathway lists, and audit array rendering
- [x] Update Papers and Patents tables, scope filters, detail sheets, and node editor
- [x] Update DOI and patent-ID linking plus audit, history, trace, queues, and global filters
- [x] Verify per-Pathway scope, writes, filtering, responsive UI, and removal of record-level scope


## Prompt 15 — Rename pathway node labels
- [x] Centralise the four node labels in `NODE_LABELS`
- [x] Replace legacy labels across Data Review and pathway views
- [x] Update Excel template headers while accepting legacy headers
- [x] Verify audit/history/URLs and both Excel header formats

## Prompt 18 — Bulk add papers and patents
- [x] Add four-step bulk add flow for pasted and uploaded identifiers
- [x] Add sequential mock fetching, retry, cancellation, and result states
- [x] Add per-row and apply-to-all node and note assignment
- [x] Add audited batch linking, result export, sorting, queue, and batch search
- [x] Verify mixed paste, template upload, audit entries, links, and queue updates

## Prompt 19 — Pathway status menus
- [x] Limit row menus to relevant status verbs
- [x] Keep group assignment in Edit and the bulk bar only
- [x] Align bulk verbs and status dialog titles
- [x] Verify row, bulk, and dialog behavior

## Prompt 20 — Managed pathway groups
- [x] Migrate pathway group strings into audited group records and group IDs
- [x] Add GroupChip, group filtering, history, visibility, archive, and restore
- [x] Add create and edit group workflows with unique-name validation
- [x] Add selection and node-based bulk group assignment workflows
- [x] Protect system groups from editing, archiving, and manual membership
- [x] Verify group management, bulk assignment, typecheck, build, and console output

## Prompt 21 — Company upstream secondary nodes
- [x] Centralise allowed secondary positions and migrate seed company data
- [x] Update fit calculation, filters, chips, pathway lists, and company references
- [x] Restrict edit and add forms and audit cleared disallowed values
- [x] Verify role switching, no-fit suppliers, table layout, build, and console output

## Prompt 22 — Bulk add companies
- [x] Add four-step bulk company dialog and entry point
- [x] Support paste/upload parsing, deduplication, templates, and resolution
- [x] Add per-row and apply-all role/node assignment with validation
- [x] Create audited company records with shared batch IDs and result export
- [x] Verify table ordering, search, queue counts, links, upload, and console

## Prompt 23 — Papers and Patents position fields
- [x] Replace free matched node arrays with four position-keyed fields and migrate seed data
- [x] Add shared position-aware node chips, fields, derivation, scope, and audit rendering
- [x] Update paper and patent tables, filters, sheets, edit, and single-add flows
- [x] Update bulk paste, template validation, per-position apply controls, linking, and results
- [x] Verify derivation, zero-node records, audit history, filters, and all add flows


## Prompt 24 — Standalone pathway visibility
- [x] Add shared single and bulk visibility dialog with Replace, Add, and Remove modes
- [x] Add row, selection, by-node, and edit-pathway visibility entry points
- [x] Decouple status changes from visibility and link the independent action
- [x] Add interactive Visibility column and toolbar filter
- [x] Verify audited writes, merge behavior, filtering, and status independence

## Prompt 26 — Assign evidence nodes before fetching
- [x] Reorder bulk papers and patents to Identifiers, Nodes, Fetch, Result
- [x] Validate malformed, duplicate, and existing identifiers before node assignment
- [x] Preserve assigned nodes and fetched metadata across backward navigation
- [x] Exclude unresolved rows from creation and include their nodes in CSV export
- [x] Verify paper and patent flows, labels, outcomes, build, and console output

- [x] Prompt 28 — Shared three-row SectionToolbar across all Data Review sections

- [x] Prompt 29 — Remove all trace UI while preserving trace_id data and dev writes

- [x] Prompt 30 — Editable company evidence across review, editing, and creation

- [x] Prompt 31 — Rename user-visible company Evidence labels to Relevance with legacy import support

- [x] Prompt 32 — Add direct row and bulk revert actions to Audit Log, complete field labels, and correct audit seeds.

- [ ] Prompt 33 — Add indicator justification and edit-only method across tables, dialogs, review, and history.
