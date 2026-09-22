# Add Validation Checklist Indicator Panels

## Scope
Update only the existing Validation Checklist in the pathway Workspace. Preserve its header, groups, row styling, manual Met toggle, notes, attachments, spacing, and all unrelated cards.

## Changes
- Add the exact five criterion-to-indicator mappings requested; the other three criteria receive no disclosure control or panel.
- Reuse the Pathway Profile indicator data and row presentation for label, value, distribution bar, and observation date.
- Add a collapsed chevron and indicator count beside eligible criterion labels. Chevron clicks expand independently; criterion-row clicks continue to toggle Met.
- Replace the eligible rows’ loading shimmer with a compact indicator/override count summary. Leave rows without indicators unchanged.
- Render expanded indicator lines beneath their parent criterion, omitting the range bar when no distribution exists and preserving explicit null handling. Zero IP/research counts display as null.
- Add a hover/persistent override action. Its form shows the immutable VCG value, user value with the indicator’s unit, and a required reason.
- Store overrides as separate attributed records per user and indicator. Show each active user override independently, including author and timestamp, while keeping the VCG value visible.
- Revert only the current user’s override by appending a revert event to history; never mutate the original VCG value or erase prior override records.

## Technical Details
- Extend checklist metric input data with optional indicator descriptors derived from the existing Pathway Profile metric groups.
- Keep confirmation state storage unchanged and add a separate pathway-scoped local store for append-only override records.
- Determine active overrides from the latest non-reverted record per user and indicator; do not average or merge values.
- Stop propagation on disclosure, override, save, and revert controls so they never toggle criterion confirmation.

## Verification
- Confirm disclosures appear only on the five mapped criteria and are collapsed initially.
- Check expansion, row-level Met toggling, summaries, null/zero behavior, no-distribution behavior, and unchanged rows without indicators.
- Save multiple attributed overrides, verify VCG and user values remain visible, then revert the current user and confirm history remains intact.
- Validate the live Workspace at desktop width and confirm the current build has no errors.
