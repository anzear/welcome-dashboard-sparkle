# Per-organisation pathway visibility

## What will change
- Replace the single shared state plus organisation checkboxes with an organisation matrix.
- Show every organisation that purchased the topic as its own row.
- Give each row an independent `Visible`, `Locked`, or `Hidden` selector.
- Pre-fill each row from the pathway’s current effective visibility.
- Save the complete mapping in one audited visibility change.
- Keep `Visible` as the default for organisations without an override.
- Preserve bulk pathway editing by applying the same organisation mapping to every selected pathway.

## Behaviour
- `Visible`: shown and included in counts and benchmarks.
- `Locked`: shown but unusable; excluded from counts and benchmarks.
- `Hidden`: not shown; excluded from counts and benchmarks.
- Different organisations can hold different states for the same pathway at the same time.

## Verification
- Set one pathway to Visible for one organisation, Locked for another, and Hidden for a third.
- Reopen the dialog and confirm all three independent states persist and appear in the pathway visibility summary.
