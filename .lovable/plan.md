# Managed pathway groups

## Data model and audit
- Add managed Group records, seeded from existing pathway group names plus the system “Annex IX Part A” group.
- Replace pathway group text with `group_id`, migrate memberships, and add group lookup, membership, and organisation helpers.
- Extend audited record changes, history, reverts, and display labels to support groups and readable group references.

## Group interface
- Add a reusable GroupChip with colour dot, system/archived states, visibility details, and pathway count.
- Replace pathway table, filter, and edit-dialog group text with managed group controls.
- Add a Manage groups side sheet with search, archive visibility, counts, filtering links, edit/archive/restore/history actions, and protected system groups.
- Add create/edit group dialogs with unique-name validation, five colour choices, visibility selection, and description.

## Assignment workflows
- Upgrade selected-row assignment to choose, clear, or create a non-archived user group with a change preview.
- Add Bulk assign group by node for Feedstock, Process, Product, or Application, including previews and matching pathway details.
- Prevent manual assignment to system groups and audit every changed pathway through `group_id` updates.

## Verification
- Verify create/edit/archive/restore and history behavior.
- Verify table chips/filtering and both assignment workflows, including clearing and system-group restrictions.
- Run type checks and inspect the live Pathways page for errors.
