# Reorder bulk paper and patent intake

## Changes
- Reorder the shared bulk flow to **Identifiers → Nodes → Fetch → Result** and update its guidance and action labels.
- Validate malformed, duplicate, and existing identifiers during intake; show excluded rows and existing-record links before node editing.
- Let valid new rows receive position-specific nodes and notes before lookup, including apply-to-all controls and zero-node support.
- Keep sequential lookup, cancellation, retry, and fetched metadata; show assigned nodes read-only during lookup.
- Preserve fetched metadata when returning to Nodes, and confirm before returning to Identifiers because node edits will be discarded.
- Prevent unresolved rows from being created, report them as **Not created · fetch failed**, and include all node columns in results CSV.
- Verify both paper and patent flows in the live preview without changing audit behavior.
