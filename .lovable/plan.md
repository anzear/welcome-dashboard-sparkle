# Companies review workspace

## Goal
Replace the Companies placeholder with audited match review, editable company profiles, and manual company-to-pathway linking. Keep all writes on the existing `recordChange` path and leave the Super Admin control-center page unchanged.

## 1. Extend the shared audit primitives safely
- Add nested company profile-field support to `recordChange`, using field keys such as `profile_fields.employees` so each edit, clear, add, and revert remains a single field-level audit entry.
- Preserve null versus zero and update company timestamps/actor exactly like top-level fields.
- Reuse the existing create path for new Company and CompanyMatch records; expose no direct mutators.
- Extract the history timeline body into a reusable shared component so both `RecordHistorySheet` and the Company profile History tab show identical entries and revert behavior.

## 2. Build the Companies section shell
- Add the secondary dark-pill switch for `Match review` and `Company profiles`, defaulting to Match review.
- Keep `Add company to pathway` on the right in both views.
- Mount one company profile sheet, one shared decision dialog, and one add/link dialog at section level so table rows and profile matches use the same actions.

## 3. Build Match review
- Render CompanyMatch rows with the requested search and Status, Role, and Pathway filters.
- Sort review-pending matches first, then by most recent change.
- Add exact role labels, Pathway tooltips, null-safe evidence/note cells, review status, actor, trace, and row actions.
- Add row selection and the sticky Accept / Reject / Clear selection bar.
- Use one single/bulk decision dialog; each affected match writes an audited `accept` or `reject` status entry and shows the ChainScout confirmation toast.

## 4. Build Company profile sheet
- Add Profile, Matches, and History inner tabs.
- Profile: show core and custom fields with `ValueCell`, inline Edit / Save / Cancel / Clear-to-null, optional note, and audited field updates.
- Add custom profile fields through the same nested field audit path, rejecting empty or duplicate keys.
- Matches: list this company’s pathway matches with shared role/status visuals and Accept / Reject actions.
- History: embed the shared company history timeline with working revert.

## 5. Build Company profiles table
- Add the requested search and nullable profile columns.
- Derive match counts and accepted/pending/rejected tooltip breakdowns live from the store.
- Wire company names and Open to the profile sheet, and History to the global record-history sheet.

## 6. Build Add company to pathway
- Step 1 captures Name, Website, Registry ID, eligible searchable Pathway, and Role.
- Resolve candidates in registry-ID, website-domain, then normalized-name order; show one hit, conflicts, precedence, and “create new anyway” choices exactly as described.
- Step 2 summarizes the link and blocks duplicate company/pathway/role combinations with a History action.
- On confirmation, audit-create a company when needed, then audit-create the accepted CompanyMatch using `link_add`, “Added manually” evidence, null trace IDs, and the requested enrichment toast.

## 7. Integrate and validate
- Replace only the Companies placeholder and retain the other unfinished sections.
- Verify pending queue counts update after decisions, all company and match changes appear in History and Audit Log, rejected records remain filterable, duplicate links are blocked, and clear-to-null never writes an empty string or zero.
- Check the live page at desktop and narrower widths, confirm no runtime errors, and confirm the existing Super Admin page is unchanged.
