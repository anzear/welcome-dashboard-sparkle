# Data Review: standalone Super Admin sub-page

## Goal
Add a role-gated, expandable Super Admin navigation group and a new standalone Data Review workspace without changing the existing Super Admin page or its tabs.

## Implementation

### 1. Shared in-memory review store
- Create `src/lib/hitlStore.tsx` with strict TypeScript types for pathways, companies, company matches, paper/patent matches, indicator values, and audit entries.
- Seed exactly 10 pathways, 8 companies, 12 company matches, 12 paper/patent matches, 20 indicator values, and 15 audit entries using realistic bioeconomy records.
- Include the three requested example pathways, deliberate nulls, human-created null trace IDs, at least two genuine zero values, all status variants, and both named actors.
- Expose arrays and mutation functions through a React context; keep all state memory-only.
- Add the mock current user with `role: "Super Admin"` to this shared store and mount the provider above the routed application.

### 2. Reusable HITL primitives
Create reusable components under `src/components/hitl/`:
- `ReviewStatusChip` for accepted, rejected, and review-pending states.
- `PathwayStatusChip` for approved, needs-approval, locked, hidden, and deleted states with the specified icons.
- `ValueCell` with strict null-versus-zero rendering and optional units.
- `TraceId` with truncation, full-ID tooltip, and hover copy action.
- `ActorStamp` with relative time and an absolute ISO timestamp tooltip.

These will use existing cards, badges, buttons, tooltip components, and semantic design tokens.

### 3. Super Admin sidebar group
- Replace the single Super Admin item with a role-gated expandable parent using its current icon and label.
- Make the label navigate to `/super-admin`; make a separate chevron toggle expansion without navigation.
- Add indented `Control center` and `Data Review` children with active-route styling.
- Automatically keep the group expanded for all `/super-admin` routes and retain the compact icon-only behavior when the sidebar is collapsed.

### 4. Data Review page
- Add `/super-admin/data-review` and a standalone `DataReview` page.
- Reproduce the existing Super Admin header-card visual language with the requested title, subtitle, access markers, and in-memory seed marker.
- Add four clickable queue summary cards whose counts are derived from store statuses.
- Add the five-item dark-pill segmented control and synchronize its selection with `?section=` for deep links, including safe fallback to Pathways.
- Render a matching placeholder card for every section.
- Add the requested development-only preview strip to the Pathways placeholder with every chip state and `ValueCell` examples for null, zero, and `42.7%`.

## Validation
- Verify counts against the seeded arrays and test every queue-card/section URL transition.
- Check parent expansion, active child highlighting, collapsed sidebar recovery, and Super Admin role gating.
- Check null, zero, units, trace copying, tooltips, and all chip variants.
- Confirm the existing `/super-admin` page and its tab row remain unchanged.
- Validate desktop and mobile-width rendering in the live preview and confirm a clean build/runtime log.
