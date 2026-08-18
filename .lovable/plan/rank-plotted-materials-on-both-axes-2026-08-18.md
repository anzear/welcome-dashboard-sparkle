# Rank plotted materials on both axes

Yes — but not by mixing the two measures into a number. Spend (EUR) and GHG (tCO2e) are different units, so multiplying or adding them would invent a fake score. The honest version is what you suggested: **average rank position**.

## What changes

The Plotted list toggle gets a third option, placed first and set as default:

```text
[ Both axes ]  [ Rank by Spend ]  [ Rank by GHG ]
```

- **Both axes** orders materials by the mean of their two existing per-axis ranks. Rank 1 on both axes = top of the list; further top-right on the chart = higher position.
- Ties on the mean are broken by the better single rank, then by name, so the order is stable.
- The two per-axis rank chips already shown on each row stay exactly as they are, so the reader can always see where the average came from.
- A new right-hand column shows the average rank (e.g. `3.5`) only while Both axes is active, labelled "Avg rank" — a position, not a score.
- The caption under the heading reads: "Ranked on the average of both axis positions. Each axis keeps its own rank."

## Notes

- No data model or store change; this is display-only logic inside `PlottedList.tsx`.
- Nothing merges the underlying measures — only the two ordinal positions are averaged, and both source ranks stay visible.
- Materials the axes cannot place are untouched and stay in the "Not plotted" side of the toggle.
