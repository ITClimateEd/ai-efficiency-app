# CLAUDE.md

## Project purpose
Decision tree web app for LLM model selection, optimized for energy efficiency.
Live at: https://tools.itclimateed.com
Repo: https://github.com/pascaljoly/ai-efficiency-app

## Before touching any code
1. Read SPEC.md — it is the authoritative reference
2. All recommendations must resolve to a valid entry in Section 2 of SPEC.md
3. All changes must satisfy GR-01 through GR-12 — no exceptions

## Key files
- `index.html` — decision tree logic and UI (single file)
- `registry.js` — validated tool and model registry
- `SPEC.md` — ground rules and registry spec (source of truth)
- `CHANGELOG.md` — log all changes here

## Ground rules (summary)
- Never recommend a filtered-out tool (GR-01)
- Only recommend from registry (GR-02)
- Alternatives must pass same filters (GR-03)
- Efficiency wins ties (GR-04)
- Flag gaps, don't fabricate fits (GR-05)
- One primary rec per path (GR-07)
- Never upsell to heavier models (GR-09)
- Non-AI is primary for image/video (GR-12)

## Open items (do not close without human review)
- 3.1 Claude version updates
- 3.3 Copilot admin warning
- 3.4 M365 Word Anthropic timeline
- 3.5 EU data boundary warning
- 3.6 Image/video gate confirmation

## When making changes
- Fix one bug at a time, commit after each
- State which GR rule the fix addresses in the commit message
- If a fix might affect another path, flag it — don't silently patch
- Never invent model names — use registry.js only

## Testing
- After any logic change, enumerate all affected paths and verify GR-01, GR-02, GR-03, GR-12 still hold
- Run rule-based tests before marking a fix complete
