# Pathway status menus

## Implementation
- Replace row-menu labels with Approve, Lock, Hide, and Delete, ordered consistently and hidden when already active.
- Add the muted “Set status” menu header and remove the row-level group action.
- Keep group assignment only in Edit pathway and the selected-row bulk bar.
- Use the same status verbs in the bulk menu.
- Update the existing status dialog title to the selected verb and singular/plural pathway count while retaining the resulting status chip.
- Remove the single-row group path while preserving the bulk group dialog.

## Verification
- Check row menus across multiple current statuses, the selected-row bulk menus, dialog titles, and group entry points.
- Run type checks and verify the live Pathways page without console errors.
