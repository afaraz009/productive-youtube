# Popup UI variants — prototype

**Question:** The extension's pitch is "simplicity — let the user actually focus on what they came here for." What should the popup look like so it doesn't itself become a settings-overload moment?

**How to run:** `npm run dev`, then open the URL Vite prints (e.g. `http://localhost:5175/src/popup/index.html`). The variant switcher is pinned to the bottom; ← / → also cycle. Each variant change updates `?variant=` so URLs are shareable. The little state panel in the top-right shows current `mode/theme/ai/blocks` so you can see what each variant changed.

The prototype is gated on `import.meta.env.DEV`. Production builds (`npm run build`) ship `PopupApp` only — verified by grepping `dist/popup.js`.

## Variants

| Key | Name | Core idea | What it removes |
|---|---|---|---|
| `current` | Current (production) | Existing PopupApp — modes + collapsible advanced + AI section. | Baseline. |
| `A` | One Big Switch | One giant Focus/Relax button fills the popup. Everything else is a tiny "…" menu. | Hides the toggle list entirely; one decision. |
| `B` | Intent picker | Asks "what's on your mind?" and offers presets: *Learn / Quick look-up / Just browsing*. Each silently picks a mode + settings combo. | Removes the concept of "modes" — user picks a goal, not a config. |
| `C` | Focus⇄Relax slider | A single slider with snap-stops (Relax / Light / Focus). Direct manipulation, no submenus. | Removes the binary feel; one knob, no buttons. |

## What to look for when comparing

- Time-to-action: how many clicks before the popup can close.
- Comprehension at first glance: would a new user understand what changes when they pick a thing?
- Reversibility: is "I picked the wrong thing" obvious to undo?
- Where AI provider, transcript language, theme go — none of the new variants surface these in the hero, which is deliberate (rule: don't overwhelm). All three demote them to a footer link / overflow menu.

## What to delete after picking a winner

Everything in this folder (`src/popup/prototype/`), plus the dev branch in `src/popup/index.tsx` (revert it to the simple chrome-storage bootstrap). Fold the winning variant's *structure* into `PopupApp.tsx` — don't promote the prototype file directly; it was written without error handling or chrome.storage wiring beyond the shell.
