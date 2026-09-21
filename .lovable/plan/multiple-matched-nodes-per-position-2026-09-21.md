# Multiple matched nodes per position

## Goal
Companies, papers and patents can each be matched to several values in the same position — several feedstocks, several processes, several products, several applications — instead of one value per position.

## Matching rule
- Within one position, the values are alternatives (any one of them can match).
- Across positions, all filled positions must match.
- A Pathway is derived when, for every position that has values, the Pathway's node is one of those values.
- A company's role position (Supplies / Produces / Offtakes) also accepts several values; every Pathway matching any of them is derived.

## What changes

### Data model (`src/lib/hitlStore.tsx`)
- Papers/patents: each of the four match positions becomes a list of values instead of one value.
- Companies: role node becomes a list of values; each secondary position becomes a list of values.
- Derivation, fit and production/application scope helpers updated to the rule above; scope explanations list which of the matched values hit the Pathway.
- Seed data updated so a few companies, papers and patents carry two or three values in one position, for review.
- Audit entries for these fields record the full list and are shown as comma-separated values, so history and revert keep working unchanged.

### Shared displays
- Node chips show every value per position, grouped under the position label, with the existing compact overflow popover.
- Node editors replace each single-value input with a multi-value picker: autocomplete over existing Pathway values, free-text new values marked "New node", chips with remove buttons, and the live derived-Pathway count.
- Company role-node line and secondary-node display list all values; fit tooltips name the matching values.

### Companies, Papers and Patents sections
- Table cells, search, filters, detail sheets, decision dialogs and Edit-nodes dialogs work off the value lists.
- Global Feedstock/Product filters pass when any matched value at that position matches, or any derived Pathway matches.
- Bulk add: each node column accepts several values separated by `|` in paste and upload, the template and inline help state this, and the per-row editors use the multi-value picker.

### Cross-section
- Audit Log, record history, trace summaries and Pathway change consequences render the value lists and recompute derived Pathways.

## Verification
Check both evidence types and Companies: chip rendering and overflow, node editing and saving, derived Pathway popovers and scope chips, global node filters, bulk paste/upload with multi-value columns, audit/history entries and revert, plus a clean build and console.

## Technical details
- Values are trimmed, compared case-insensitively and de-duplicated per position; an empty list means "not set".
- Records with no values anywhere stay valid and derive no Pathway.
- All writes stay append-only through `recordChange`, one entry per changed position.
- Client-side prototype only, no backend change.
