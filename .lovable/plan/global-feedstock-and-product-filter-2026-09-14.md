# Global Feedstock and Product filter

## Goal
Add one URL-persisted Feedstock/Product filter above Data Review that consistently narrows all six sections, live queue counts, and each section's Pathway choices.

## 1. Shared filter state and bar
- Create a `NodeFilterProvider`, `NodeFilterBar`, and `useNodeFilter()` in the shared Data Review components.
- Read and write `feedstock` and `product` through the current URL search parameters without dropping `section`.
- Derive distinct live options from Pathway records, sorted alphabetically.
- Narrow Product options by selected Feedstock and Feedstock options by selected Product.
- Expose `feedstock`, `product`, `isActive`, `matchesPathway(pathway)`, `matchingPathwayIds`, and clear/remove actions.
- Render both selects, removable active chips, and the conditional Clear action between queues and section tabs.

## 2. Preserve URL state during navigation
- Update section switching and legacy redirects to modify only `section`, preserving active node filters.
- Restore filters automatically on reload from the URL.
- Clear an invalid dependent value if live Pathway data no longer supports the selected combination.

## 3. Filter sections and local Pathway controls
- Pathways: apply the global node predicate alongside existing local filters; leave bulk deactivation and Excel import source data unchanged.
- Companies match review: keep only matches on matching Pathway IDs.
- Company profiles: keep companies with at least one matching match; count and summarize only matching matches while filtered.
- Papers, Patents, and Indicators: keep only records on matching Pathway IDs; grouped Indicators only contain matching Pathways.
- Narrow local Pathway selectors to matching Pathways and reset a selected Pathway that falls outside the global filter.
- Combine global filtering with all existing search, status, role, stale, and other controls using AND behavior.

## 4. Resolve Audit Log entries
- Resolve Pathway audit entries directly by entity ID.
- Resolve company-match, paper-match, patent-match, and indicator entries through their current record's `pathway_id`.
- Keep Company audit entries when that company has at least one match on a matching Pathway.
- Apply this predicate alongside every existing Audit Log filter.

## 5. Selection, queues, and empty states
- Recalculate all five review queue counts from globally matching records and show `filtered` when active.
- Clear bulk selections in Pathways, Companies match review, Papers, Patents, and Indicators when either global filter changes.
- Show section-specific selected Feedstock/Product empty states with a working Clear filter action; preserve existing generic empty states when no global filter is active.
- Mark Company profile match-count tooltips as filtered while the global filter is active.

## 6. Validate
- Verify dependent option narrowing, single-chip removal, Clear, URL persistence, reload restoration, and section switching.
- Verify all six sections, both Company views, grouped Indicators, Audit Log resolution, local Pathway option narrowing, bulk-selection clearing, and live queue counts.
- Check wide and narrow layouts, runtime diagnostics, and build output.
