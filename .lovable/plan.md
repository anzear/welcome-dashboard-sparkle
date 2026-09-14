# Indicators review workspace

## Goal
Replace the Indicators placeholder with a complete audited review workspace for pipeline values and human corrections. Preserve null-versus-zero behavior, make the displayed-value rule explicit, and keep benchmark effects local to confirmation toasts.

## 1. Extend indicator records and shared rules
- Add nullable `corrected_at` to `IndicatorValue` and export `STALENESS_DAYS = 180`.
- Export `displayedValue(iv)` so corrected values win, rejected uncorrected values display null, and all other rows display the pipeline value.
- Export `isStale(iv)` using `corrected_at` and the 180-day window.
- Seed at least three corrected records, including two corrections older than 180 days, while retaining deliberate zero and null pipeline examples.
- Keep seed audit entries consistent with the resulting current record values.

## 2. Build the indicator toolbar and flat table
- Add search, Indicator, Status, and Pathway filters plus “Stale corrections only”.
- Add the standard dark-pill Flat / By pathway view switch and show `staleness window: 180 d` in muted monospace at the section edge.
- Sort pending rows first, then newest `value_date`, with null dates last.
- Render all requested value, correction, displayed, date, status, staleness, note, trace, and action columns using null-safe `ValueCell` output.
- Show units only beside non-null values and make the displayed value bold.
- Add single-row actions and the sticky bulk Accept / Reject / Clear selection bar.

## 3. Add the grouped Pathway view
- Group the same filtered rows by Pathway without changing their row ordering.
- Render a collapsible Pathway header with the full four-node chain and pending-row count only.
- Expand groups containing pending values by default.
- Reuse the same indicator columns and actions inside each group, omitting only the repeated Pathway column.
- Add no totals, averages, scores, or derived group metrics.

## 4. Add audited Accept and Reject decisions
- Use one shared decision dialog for single and bulk actions with the status chip, row/bulk summary, optional note, and rejection display warning.
- Write one `accept` or `reject` status change through `recordChange` per affected row.
- Show the exact acceptance/rejection toasts and update the pending queue live.

## 5. Add audited corrections
- Build the Correct dialog with pipeline/current corrected values, unrestricted numeric input, conditional unit editing, date defaulting to today, and optional note.
- Preserve `0` as a valid correction while disabling Save only for an empty input.
- On save, write changes in the specified order: corrected value, changed note, newly set unit, changed value date, `corrected_at`, then accepted status when needed.
- Use the required benchmark-update toast.

## 6. Add clear-correction behavior
- Show the resulting displayed pipeline value or em dash before confirmation.
- Audit `corrected_value → null` followed by `corrected_at → null`, leaving status unchanged.
- Never substitute zero for a cleared correction.

## 7. Integrate and validate
- Replace only the Indicators placeholder; leave the Super Admin control center and other Data Review sections unchanged.
- Verify both views, filters, default expansion, stale-only filtering, bulk decisions, queue counts, exact displayed-value precedence, rejected empties, zero correction, clear-to-null, units, History, Audit Log diffs, and absence of aggregates.
- Check desktop and narrower layouts plus runtime and build diagnostics.
