# Changelog

All notable changes to the AI Model Efficiency Guide registry are documented here.
Versions follow [Semantic Versioning](https://semver.org): patch for corrections, minor for new models or modes, major for structural changes.

---

## [1.3.0] — 2026-05-22

### Added
- `REGISTRY_VERSION` and `REGISTRY_LAST_UPDATED` constants at the top of `registry.js`
- `CHANGELOG.md` — this file
- `vendor` field on every primary recommendation node and every fallback object (GR-01/GR-03, WI-10). Values: a `KNOWN_VENDORS` key, or `null` for platform-agnostic / non-AI tools that always show regardless of vendor filter.
- GR-05 gap card: when the vendor filter is active and no recommendation matches, the card now states exactly what the user asked for, the best available recommendation (filtered out), and which vendor requirement it doesn't meet (WI-11).
- GR-08 developer guardrail in `renderResult()`: `console.warn('[GR-08] ...')` fires if a registry entry is missing a tool name, or if a vendor-split card would render with no model/mode field (WI-12).

### Changed
- Cursor entries updated to efficiency-first model shortlist: Auto (mandatory default), Composer 1.5, Composer 2, Claude Sonnet 4.5, GPT-5.2 Codex. Claude Opus and GPT-5.5 excluded (WI-03).
- GitHub Copilot updated to proxy model selection: Auto (default, GR-11), GPT-5.3-Codex (1× LTS), GPT-5.4-mini (0.33×), Claude Haiku 4.5 (0.33×), Claude Sonnet 4.6 (mid-tier). GPT-5.5 and Opus variants excluded (WI-04).
- M365 Copilot Word entries updated to 3-mode structure: Auto, Quick Response, Think Deeper. No underlying model names surfaced to users (WI-05).
- M365 Copilot Excel and PowerPoint updated with full model list: Auto (default, GR-11), GPT-5.4, GPT-5.5, Claude Opus 4.6, Claude Opus 4.7. Anthropic models enabled by default in M365 since May 4, 2026 (WI-06).
- GR-11 applied to proxy tools (Cursor, M365 Copilot, GitHub Copilot): the Model field in recommendation cards now shows "Auto" unless the registry string already encodes a specific mode (e.g. "Cursor (Composer 2)") (WI-09).
- `githubCopilotModels` and `m365OfficeModels` arrays annotated with GR-09 / GR-11 ordering comments confirming Auto-first (WI-09).

### Removed
- Whisper (OpenAI) and AssemblyAI from all transcription/captioning recommendations — replaced with platform-embedded tools (Teams / Zoom / Meet) as the primary and Microsoft Teams Premium as the fallback (WI-07).
- Veo (Google) from all video generation recommendations — no approved AI video tool in the current enterprise shortlist. Replaced with non-AI alternatives (slide animation, professional production) (WI-07).

---

## [1.2.0] — 2026-05-01

### Added
- GR-12 media-availability gate: for `img_gen_chat`, `img_gen_slides`, `img_edit`, and `vid_gen`, a gate question ("Do you have stock images, personal photos, or existing media available?") now appears before any AI model is recommended (WI-08).
- `nonai` entries on all four gated tasks — rating 🟢 Lightest, surfaced on the Yes path. No AI model appears as a primary recommendation on the Yes path under any circumstance (GR-12).
- `vid_gen` restructured: No path recommends slide-based animation (simple) and professional video production (moderate/complex) with explicit energy cost statements. Fallbacks are screen recording with voiceover and motion graphics tools (WI-07/WI-08).

---

## [1.1.0] — 2026-05-01

### Added
- `registry.js` extracted from `index.html` — all recommendation data now maintained independently of UI logic.
- `vendorLabels`, `tasks`, `ratings`, `githubCopilotModels`, `m365OfficeModels`, and `recommendations` objects defined in registry.

### Notes
- Initial extraction. No recommendation content changed in this version.

---

## Review triggers

A registry review is required when any of the following occur:

| Trigger | Typical action |
|---|---|
| Major model release from OpenAI, Anthropic, Google, or Microsoft | Check efficiency-first ordering; update model names and cost multipliers |
| M365 Copilot model availability change (Word, Excel, PowerPoint) | Update `m365OfficeModels`; update fallbacks on `write.*`, `analyze.*`, `design.*`, `img_gen_slides.*` |
| GitHub Copilot model policy change | Update `githubCopilotModels`; check multipliers and tier notes |
| Cursor native model change (Composer series) | Update Cursor fallback entries in `code_build.*` and `code_automate.*` |
| Platform-native tool change (Teams, Zoom, Meet transcription/captioning) | Update `transcribe.*` and `vid_caption.*` entries |
| Quarterly cadence | Review all entries; focus on `lastValidated` dates older than 90 days |

When a review is complete:

1. Update the affected entries in `registry.js`
2. Update `lastValidated` on every reviewed entry (even if unchanged)
3. Bump `REGISTRY_VERSION` (patch / minor / major per the scheme above)
4. Update `REGISTRY_LAST_UPDATED` to today's date
5. Add a section to this file describing what changed and why
