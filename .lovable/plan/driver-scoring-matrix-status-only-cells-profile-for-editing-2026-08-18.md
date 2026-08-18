# Driver Scoring matrix: status-only cells, profile for editing

## What changes

The matrix becomes a read-only coverage view. Cells no longer show numbers or intensity — only whether a driver is scored or not. Editing a single material happens on its material profile; bulk scoring stays exactly as it is today.

1. **Cells show status, not score**
   - Scored: filled teal marker (single flat tone, no 1–5 shading, no digit).
   - Not scored: hollow dotted marker.
   - Tooltip still names the material, the driver, and the recorded score, note, scorer, and date so the value stays inspectable on hover.

2. **No in-cell editing**
   - Remove keyboard number entry, Backspace/Delete clearing, and the focus cursor / arrow-key navigation from cells.
   - Cells become non-interactive presentation elements.

3. **Material name opens the profile**
   - Clicking the material name (and its row area outside the checkbox) opens the material profile, where the 1–5 driver rails are already editable.

4. **Bulk scoring unchanged**
   - Checkbox selection and the bulk scoring panel (driver dropdown, prev/next driver, staged changes, Save/Cancel) keep working as they do now.

5. **Copy and legend**
   - Legend reduces to two items: scored / not scored (not zero).
   - The matrix hint line changes to describe: select materials to score in bulk, or click a material to score it on its profile.
   - Right-hand coverage column (`x/11 · n strong`) stays as is.

## Technical notes

Single file: `src/components/materialRegister/DriverScoring.tsx`.

- Drop `onCellKeyDown`, `cursor`/`focusCell`/`move`, and the related `useEffect`; keep `sort`, filters, selection, and row-splitting logic untouched.
- Replace the cell `<button>` with a `<span>` marker driven only by `v === null`; stop using `scoreTone`/`signed` for cells (keep `signed` in tooltips).
- Material-name cell calls `openBrief(m.material_id)` from `useRegister` (same pattern as `DriverListView`).
- No data-model, store, or scoring-logic changes.
