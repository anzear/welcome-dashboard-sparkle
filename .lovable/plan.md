# Indicator justification and method

## Build
- Extend indicator values with nullable justification, method tag, and method detail fields; add central method labels and audit field labels.
- Seed realistic justifications and method metadata, keeping some values null and marking human-corrected rows appropriately.
- Add the clickable Justification column to flat and by-target tables, preserve em dashes for missing/not-computed values, and include justification in search.
- Extend Correct with justification and method controls, focus Justification when opened from its table cell, normalize cleared text to null, and allow metadata-only saves without changing status or correction data.
- Extend Add value with required justification and an Expert judgement default plus optional method detail.
- Show justification read-only during Accept/Reject decisions.
- Show the current method chip only in indicator History headers; keep method absent from tables and decision dialogs.
- Ensure every field change uses audited record changes and renders under its human-readable field label.

## Verification
- Verify flat and by-target justification cells, truncation/tooltips, missing values, click-to-focus, and search.
- Verify metadata-only correction saves, null normalization, method labels, and unchanged correction/status state.
- Verify Add value validation/defaults, decision justification, History method chip, and Audit Log entries.
- Run TypeScript/build checks and live browser flows without console errors.
