# Unified Data Review section toolbars

## Changes
- Add a shared `SectionToolbar` that renders the section heading/actions row, uniform filter row, optional reset/count area, and conditional selection bar.
- Move each section title and description from the outer card into its own shared toolbar configuration.
- Move Pathways management and bulk actions into one `Bulk actions` menu; keep all existing dialogs and handlers unchanged.
- Standardize search, select, switch, date, and view-toggle sizing/order while preserving each section’s existing filter logic.
- Add conditional reset links and filtered/total row counts for every section.
- Keep single/bulk add split buttons for Pathways, Companies, Papers, and Patents; keep Add value for Indicators; place Audit Log export in its header.
- Verify all six sections at desktop width, selection bars, reset behavior, action menus, and existing dialog entry points.
