# Fix Data Review chip wrapping

## Outcome
All Data Review chips keep their icon and full label on one line at desktop widths, while wide tables scroll horizontally instead of compressing chip columns.

## Implementation
- Standardize every chip in the Data Review area to an inline, vertically centered `h-6`, `px-2`, `text-xs`, non-wrapping treatment.
- Give Status, Scope, Role, Fit, Operation, and Entity type table columns enough minimum width for their longest label.
- Keep checkbox and Actions columns pinned while Pathways, Companies, Papers, Patents, Indicators, and Audit Log tables scroll horizontally.
- Apply the same no-wrap treatment to chips in history, detail sheets, dialogs, and popovers.
- Verify the Data Review sections at 1280px and the current desktop width, including horizontal scrolling and pinned edge columns.

## Technical details
- Reuse the existing semantic color variants and shared chip components.
- Add sticky backgrounds and stacking order to edge header/data cells so pinned columns remain readable while scrolling.
- Preserve all existing review actions and data behavior.
