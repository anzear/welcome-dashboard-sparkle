# Pin Inter across the Material Portfolio

The app currently defines no font family at all, so text falls back to each viewer's system font (SF Pro on macOS, which is what the screenshot shows, Segoe/Arial elsewhere). Pinning Inter makes the portfolio render identically everywhere and matches the screenshot's look.

## What changes

- Load Inter (weights 400/500/600/700) plus its tabular-figure feature.
- Apply it to the Material Portfolio only — the register, brief, assessment, gate, visualisation and dialogs launched from them.
- Keep the existing monospace treatment for numeric columns and chart tick labels; only the surrounding UI text changes.
- No layout, spacing, size or colour changes. Text sizes stay at the current 10/11/12px executive-summary scale.
- The rest of the app (Value Chain, other pages) keeps its current default font.

## Technical notes

- Add the Inter web font via `<link>` in `index.html` (preconnect + display=swap).
- Add a `sans-portfolio` family to `tailwind.config.ts` mapping to `Inter, ui-sans-serif, system-ui, sans-serif`.
- Apply `font-sans-portfolio` (plus `antialiased` and `font-feature-settings: "cv11","ss01","tnum"`) on the portfolio root wrapper in `src/pages/MaterialPrioritisation.tsx`, so all nested components inherit it.
- Portal-rendered content (dialogs, popovers, dropdowns from the register/brief) does not inherit from the page wrapper; add the same class to those wrappers in the portfolio's dialog/popover components so bulk actions, classification, criteria set, export and column pickers match.
