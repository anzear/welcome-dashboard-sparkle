# Companies node assignment and fit

## Goal
Replace company-to-Pathway match rows with one reviewed role-node assignment per company. Derive every related Pathway from that node, while secondary nodes explain fit without excluding any Pathway.

## Implementation

1. **Migrate the local data model**
   - Move role, role node, secondary nodes, status, evidence and note onto each company.
   - Derive the role from each company's most frequent seeded match role and migrate legacy statuses using the requested precedence.
   - Add `rolePosition`, company `derivedPathwayIds`, and `computeFit` helpers with case-insensitive trimmed matching.
   - Remove `CompanyMatch` and `company_match` from the active store, audit entity union, record lookup and trace registry; map seeded match audits to their companies.
   - Extend audited nested-field reads/writes for `secondary_nodes.*`.

2. **Add shared company matching displays**
   - Build `FitChip`, `RoleNodeLine`, `SecondaryNodes`, and `DerivedPathwaysForCompany`.
   - Show full node labels, fit explanations, role-position emphasis, matched-secondary emphasis, and exact-to-broad ordering.
   - Keep secondary nodes informative only; derivation depends exclusively on role and role node.

3. **Rebuild the Companies workspace**
   - Replace the two-view layout with one company table and the specified search, Role, Status and Fit filters.
   - Add selection, bulk decisions, row decisions, Edit nodes, History and Add company actions.
   - Apply the global Feedstock/Product filter using direct role-node matches or any derived Pathway.
   - Rebuild the company sheet with Pathways, Profile and History tabs; group Pathways by fit and preserve rejected rows in a muted state.

4. **Implement audited company workflows**
   - Update Accept/Reject to act on company status and include the role node plus derived impact summary.
   - Add the role-aware Edit nodes dialog with free-text autocomplete, canonical casing, New node badges and live fit preview.
   - Rework Add company into Identify and Nodes steps, preserving match precedence and enforcing the requested duplicate rule.
   - Write each changed field separately through `recordChange`; create new companies with the full node-assignment snapshot.

5. **Update shared references and consequences**
   - Rename the queue to “Companies pending review” and count filtered company records.
   - Show company name and compact role-node context in Audit Log, history and trace records.
   - Rebuild Pathway node-change consequences into an automatic before/after diff for companies, papers and patents, plus indicator-only decision options.
   - Ensure node changes do not write status changes to companies, papers or patents.

6. **Verify**
   - Check all table filters, fit sorting/grouping and popovers.
   - Exercise accept/reject, per-field node edits, duplicate blocking and company creation; inspect audit history for exact field names.
   - Verify Pathway consequence diffs, global node filters, queue updates, narrow layouts, console state and the final build.
   - Confirm no `CompanyMatch`, `company_match`, or single-Pathway company UI remains.

## Technical details
- Company Pathways are all non-deleted Pathways matching `company.role_node` at the role position.
- Fit compares only the three non-role positions: exact when every known value matches, strong when known values both match and differ, broad otherwise.
- Existing profile fields retain their current nullable edit behavior.
- This remains entirely client-side with no server or registry changes.
