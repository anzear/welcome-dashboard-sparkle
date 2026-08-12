# Calm down the Register screen

The register currently shows everything at once: a tinted control band, a segmented "Ranked by" control, a coverage readout, a Columns menu, nine filter dropdowns in one row, chips beneath, and a table that sits on a grey tint with green accent columns. Visual, presentation-only cleanup — no data, logic or column behaviour changes.

## 1. Give the table a real surface

- Table sits on a solid `card` background (white in light mode) inside one rounded container with a single hairline border.
- Header row: solid `card` background, no `bg-muted/60` tint, no backdrop blur, bottom hairline only.
- Pinned cells (checkbox, rank, material) use the same solid `card` background so they don't flash a different colour while scrolling.
- Row separators drop to the faintest hairline; keep the 46px row height and hover tint.
- Remove the accent tint on the active measure column background; the active measure stays marked in the header label only (medium weight + faint accent unit line).

## 2. One quiet toolbar instead of a control band

Replace the tinted band with a single un-tinted toolbar row above the table:

```text
[ Search............ ]  [ Filters (3) v ]  [ Ranked by: Spend v ]        [ Columns v ]
   42 of 42 materials · 4 missing spend figure
```

- Drop the band tint and its hairline; the toolbar breathes on the page background.
- "Ranked by" becomes a compact dropdown (Spend / Emissions / Volume / Applications) rather than a four-button segmented control.
- Coverage readout ("Ranking X of Y", the missing-count toggle) and the row count merge into one faint caption line under the toolbar — one sentence, not two blocks.

## 3. Fold the filters into one popover

- Nine always-visible dropdowns collapse into a single **Filters** button showing an active count.
- Popover holds the same nine controls, stacked in a narrow panel with section labels, plus "Clear all" at the bottom.
- Active filters continue to show as chips below the toolbar (unchanged behaviour), so what's applied stays visible without the wall of dropdowns.
- Same treatment applied to the Driver Scoring and Prioritisation filter bars so all three screens match.

## 4. Lighter chrome elsewhere on the screen

- Status and priority pills keep their muted progression but lose the border where the tint already reads.
- Selection bar and undo toast keep their behaviour, restyled to the same hairline-on-card language.
- Applications chips render as plain text with a comma separator plus overflow count (fewer boxes per row).

## Technical notes

- `src/components/MaterialRegisterTable.tsx`: rewrite `HEAD` / `STICK` constants to `bg-card`, drop `emphHead` background tinting, restructure the control band into the toolbar + caption, swap the measure segmented control for a popover select.
- `src/components/materialRegister/FilterSelects.tsx`: add a collapsed `popover` presentation mode that wraps the existing `MultiSelectFilter` list; keep the `include` prop so each screen shows its own subset.
- `src/components/materialRegister/primitives.tsx`: soften `StatusPill` borders; simplify the applications cell.
- `src/components/materialRegister/DriverScoring.tsx` and `Prioritisation.tsx`: use the new collapsed filter mode.
- No changes to `registerStore.tsx` filter state, ranking logic, or the column set.
