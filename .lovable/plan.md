# Plan: Remove `target_date`, merge into `earliest_need_date`

## Problem

The brief Decision Bar shows two overlapping "when" fields:
- **Priority period** — editable free-text planning bucket (e.g. "H2 2026")
- **Target date** — a derived date that is read-only (no editing UI anywhere), backed by `target_date` with a fallback to `requirements.earliest_need_date`

`target_date` has no editing surface, duplicates the concept of a date already captured in Requirements, and clutters the Decision Bar. The user wants it gone: `earliest_need_date` in Requirements becomes the only date.

## Scope

Remove the `target_date` field and all its plumbing. Migrate existing seed-data values into `requirements.earliest_need_date` so no data is lost. Priority period stays as the sole Decision Bar timing field.

## Changes

### 1. Data model — `src/types/materialPrioritisation.ts`
- Delete `target_date` from the `Material` interface.
- Delete the `targetDateOf` helper function (lines 92–95). Anywhere that needs the date reads `m.requirements?.earliest_need_date ?? null` directly.

### 2. Seed data — `src/data/materialPrioritisationMock.ts`
- In the seed row objects, migrate each `target` value into the `req.earliest_need_date` field. For rows that have `target` but no `req` object, create a minimal requirements object carrying only `earliest_need_date` (other fields stay null via `emptyRequirements()`).
- Remove `put("target_date", ...)` from the provenance builder (line 440).
- Remove `target_date: row.target ?? null` from the output object (line 486).
- Remove `"target_date"` from `PROVENANCE_TRACKED` (line 520).

### 3. Store — `src/components/materialRegister/registerStore.tsx`
- Remove `targetDateOf` import.
- Delete `TargetDateBand` type, `TARGET_DATE_BANDS` array, and `targetDateBand` function (lines 123–142).
- Remove `targetDates` from `Filters` interface (lines 158–159) and `EMPTY_FILTERS` (line 179).
- Remove the `targetDates` filter-matching block in the `useMemo` (lines 366, 402–404).

### 4. Filters — `src/components/materialRegister/FilterSelects.tsx`
- Remove `targetDateOf`, `TARGET_DATE_BANDS`, `targetDateBand` imports.
- Remove the `targetDates` options block (lines 78–84).

### 5. Filter chips — `src/components/materialRegister/FilterChips.tsx`
- Remove `TARGET_DATE_BANDS` import.
- Remove the `"targetDates"` case in `labelFor` (line 23).
- (The `"targetDates"` entry is already absent from the chips iteration array — confirmed at line 42, it was removed in an earlier pass.)

### 6. Brief Decision Bar — `src/components/materialRegister/MaterialBrief.tsx`
- Remove the `targetDateOf` import (line 11) and the `const targetDate = targetDateOf(m)` computation (line 611).
- Delete the "Target date" `BarField` block entirely (lines 804–808). Priority period remains the only timing field in the bar.

### 7. Material entry — `src/components/materialRegister/materialEntry.ts`
- Remove `target_date: null` from the initial material state (line 157). `earliest_need_date` is already handled in the requirements form.

### 8. Event logging
- Verify no event type references `target_date`. If any `field_correction` or mock event touches `target_date`, remove it. (Based on search, `target_date` does not appear in `materialEventsMock.ts`.)

## What stays

- **Priority period** — unchanged in every surface (brief, register, filters, bulk edit, events).
- **`earliest_need_date`** — remains editable in the Add Material form (`SingleMaterialForm`). It is the sole date source after this change.
- **Requirements dialog** (evidence docs) — unchanged; it was never related to `target_date`.

## Out of scope

- No changes to the register table column set (it never had a Target date column).
- No changes to `src/lib/materialEvaluation.ts`, `src/pages/MaterialBrief.tsx`, `src/lib/exportCompanyPdf.ts`, or `src/components/MaterialEvaluationDrawer.tsx` — these reference a separate `targetDate` concept in the evaluation/decision system, unrelated to the material `target_date` field.
