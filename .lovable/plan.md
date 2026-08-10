## Improve the tree/flow view in ValueChainPathways

Two changes to `src/pages/ValueChainPathways.tsx` in the expanded feedstock tree block (~lines 1275–1336):

### 1. Stop application nodes from navigating away

Currently clicking an application node in the tree (`<Node ... onClick={() => handleCardClick(a.row.originalIndex)}>`) opens the pathway profile, which the user finds jarring.

- Remove `onClick` from the application `Node` so it becomes a passive display.
- Instead, when a technology is "active" (single-tech view), show a small **"Go to profile →"** button in the header row next to the existing `Showing <proc> · N apps` label.
  - If there is exactly one row for the active technology, the button navigates to that pathway (`handleCardClick(row.originalIndex)`).
  - If there are multiple rows, each application row in the SVG gets a compact inline "→" button (rendered inside a `foreignObject` alongside the TRL badge) that triggers `handleCardClick` for that specific row. The application label itself is no longer clickable.

### 2. Allow viewing all technologies expanded at once

Add a small toggle in the same header row, next to the "Go to profile" control:

- **Single** (default, current behaviour) — click a technology node to swap the active branch; only its applications are drawn.
- **All** — render every technology row with all of its applications simultaneously (full tree spread out).

Implementation:

- Add per-feedstock state `treeMode: Record<string, 'single' | 'all'>` alongside the existing `treeExpandedProc`.
- In `'all'` mode:
  - Compute layout so each technology row has its own vertical block sized to its app count (`rowH = max(PROC_H, appCount * APP_H)`), stacked vertically. Total `svgH` becomes the sum of row heights + padding.
  - For each technology, draw feedstock→process and process→material curves to that row's center, plus material→app→trl curves to each of its apps at their local y positions.
  - Every process node is styled as "active" (no dimming), and clicking a process node in `'all'` mode is a no-op (or scrolls it into view) rather than filtering.
- In `'single'` mode: behaviour is unchanged.

### 3. Keep interactions consistent

- The tech process nodes remain the primary way to filter in Single mode.
- Navigation to the pathway profile happens only via the explicit "Go to profile" button(s), never by clicking application/TRL/tech tiles.

### Files changed

- `src/pages/ValueChainPathways.tsx` — header controls, per-feedstock `treeMode` state, tree layout branching for `all` vs `single`, remove app-node `onClick`, add explicit profile buttons.

No new dependencies, no backend changes.
