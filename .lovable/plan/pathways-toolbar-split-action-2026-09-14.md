# Pathways toolbar split action

## Changes
- Replace the separate **Import Excel** and **New pathway** toolbar buttons with one attached primary split button.
- Keep **New pathway** as the main action; add a chevron menu for **Single pathway**, **Import from Excel…**, and **Download import template**.
- Reuse the existing import dialog unchanged and extract its current template generation into a shared trigger.
- Add **New pathway** and **Import from Excel** actions to the unfiltered empty table state while preserving the node-filter empty state.
- Verify both dialog entry points and direct template download in the live preview.
