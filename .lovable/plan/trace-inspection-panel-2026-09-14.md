# Trace inspection panel

## Goal
Make every non-null trace identifier across Data Review open one shared, read-only panel showing its mocked LLM call, produced records, related human decisions, and trace-carrying audit entries. Keep human-created records explicitly trace-free.

## 1. Add the local trace registry
- Create `mockTraces.ts` with the requested `LlmCall` fields plus the optional synthesis note.
- Cover every trace identifier present in seeded records and seeded audit entries.
- Assign chains consistently by source: Pathways to ChainScout Fit, company matches to ChainScout, papers/patents to their matching chains, and indicator values to their named Indicator chain.
- Implement deterministic fallback generation for unknown development-helper traces using `Indicator · (dev)` and `synthesised — not in registry`.
- Make `getTrace(traceId)` synchronous and entirely local.

## 2. Add one global Trace sheet
- Create a provider and `useTraceSheet()` hook alongside a single page-level `TraceSheet` mount.
- Update `TraceId` so the identifier opens this panel while retaining the independent hover copy action.
- Render null traces as `no trace · human-created` with the required explanation tooltip and no fabricated identifier.
- Show the full trace header, chain chip, model/prompt metadata, absolute call time, and all call metrics/summaries with `ValueCell`.

## 3. Link trace records and decisions
- Resolve every current store record whose `trace_id` matches the open trace.
- Show compact record rows with entity chip, record ID, one-line entity-specific summary, current status, and displayed indicator value where applicable.
- Link each record ID to the existing Record History sheet rather than reproducing history.
- List qualifying human audit decisions for those record IDs and compute the requested accepted, rejected, corrected, and reverted counts.
- Separately list audit entries whose own `trace_id` matches the call.
- Reuse `ActorStamp`, `OperationChip`, `ValueDiff`, and the required empty states.

## 4. Complete trace surfaces without layout redesign
- Add a Trace column before Actions in the Pathways table.
- Confirm trace controls remain present in company matches, paper/patent matches, indicators, Audit Log, and record history.
- Add compact trace display to detail/profile sheets where it is currently absent, without changing their structure.
- Ensure clicking traces from an already open history/detail sheet opens the single global Trace sheet safely.

## 5. Extend Audit Log filtering
- Add the `Trace` filter with All, Has trace, and No trace (human-created).
- Include it in filtering, reset, and page-reset dependencies while preserving existing search, export, and pagination behavior.
- Keep the development simulation strip unchanged; its generated trace must open the deterministic synthesized call.

## 6. Validate
- Verify a known trace from each record family opens with the correct chain and linked record summary.
- Verify record links open the existing Record History sheet and trace links inside history remain usable.
- Verify decision counts and audit lists update from current in-memory actions.
- Verify null traces show only the human-created message.
- Run the development helper and confirm its unknown trace opens the synthesized panel without errors.
- Verify the Audit Log Trace filter, Pathways Trace column, responsive containment, runtime diagnostics, and build output.
