# Shared split add buttons

## Changes
- Extract the attached primary split-button pattern into a shared `SplitAddButton` used by Pathways, Papers, Patents, and Companies.
- Keep each main action opening its existing single-add dialog; menu actions open the existing single or bulk dialogs and directly download the existing template.
- Move each existing template generator to a reusable exported helper without changing the generated workbook.
- Remove standalone bulk-add toolbar buttons.
- Add or preserve two explicit single/bulk actions in each section’s unfiltered empty state.
- Verify all four menus, dialog entry points, direct template downloads, and responsive toolbar rendering.
