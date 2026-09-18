# Simplify stage goals in the Status card

## What will change
- Keep the seven-stage status control unchanged.
- Keep Parked exactly as it works today, including its reason, movement trigger, review date, and actions.
- Replace non-Parked stage conditions and other stage-specific details with one stage goal.
- Show only the current stage’s goal beneath the status control.
- Support the requested empty, editing, and written states, with owner and date stamps.
- Leave Recommendation unchanged.

## History behavior
- Store goals by stage so returning to a stage can show its saved goal.
- When the status changes, log the outgoing stage’s goal in History with its stage, text, owner, and date.
- Never stack previous goals in the live Status card.

## Technical details
- Extend the material record with per-stage goal entries and seed safe empty defaults for existing records.
- Add a goal-saving action to the shared material register and use existing owner permissions and history events.
- Remove condition editing and condition alerts from the shared Status card UI while retaining compatibility with older stored records.
- Verify both Research Space and Material Profile, because both use the same Status card.
