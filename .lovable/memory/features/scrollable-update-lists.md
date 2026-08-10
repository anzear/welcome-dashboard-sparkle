---
name: Scrollable update lists
description: Pathway update feeds and long in-card lists must always be scrollable when content exceeds the visible panel height.
type: feature
---
Pathway update feeds and other long in-card lists must support vertical scrolling whenever content exceeds the visible panel height.

How to apply:
- Prefer `flex-1 min-h-0 overflow-y-auto` on list containers inside cards or tabs.
- Ensure parent flex/grid wrappers also allow shrinking with `min-h-0` so inner scrolling works.
- Avoid fixed list heights when the surrounding panel already defines available height.