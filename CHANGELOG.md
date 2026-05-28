# Changelog

All notable changes to the AI Model Efficiency Guide registry are documented here.
Versions follow [Semantic Versioning](https://semver.org): patch for corrections, minor for new models or modes, major for structural changes.

---

## [2.3.0] — 2026-05-28

### Added

- `tasks.text`: new `email` task — "Write an email" — appears before the general `write` task.
- `recommendations.email.simple`: non-AI primary recommendation (`Standard email client (Outlook / Gmail / Mail)`, 🟢 Lightest). Routine emails don't require AI — tool picker is skipped for this path (GR-04).
- `recommendations.email.moderate` / `email.complex`: AI paths copied from `write.moderate` / `write.complex` for cases where AI assistance is genuinely warranted.
- `registry spec`: `Standard email client (Outlook / Gmail / Mail)` added to Section 2.12 (Platform-Native, Zero AI Cost).

### Changed

- `tasks.text.write` label updated from `'Write (email, post, summary, draft)'` to `'Write (post, summary, report, draft)'` — email now has its own task entry.

---

## [2.2.1] — 2026-05-28

### Removed
- `vid_gen.*.vendorAlts.chatgpt` (Sora): removed — Sora is no longer available (GR-01). Google Veo 2 via Gemini remains the only AI video generation option in the tool picker.

---

## [2.2.0] — 2026-05-28

### Added

- `vid_gen.*.vendorAlts`: added `chatgpt` (Sora) and `gemini` (Google Veo 2) vendor options for the generate-new-content path. Simple → standard quality (🔴); moderate/complex → HD quality (🟣). The tool picker now appears after "No — I need to generate new content" for video generation tasks.

### Fixed

- `rules.js / isGreenestOption`: null-vendor primary recommendations (non-AI alternatives, e.g. professional production) are no longer included in the "best available" energy-tier comparison. They are not selectable in the tool picker and must not skew the greener-alternative benchmark.
- `rules.js / getGreenestAlternative`: now returns null when the best candidate is the same tier as the current vendor — previously it would surface an equally-heavy tool as a "greener" option.

---

## [2.1.0] — 2026-05-28

### Added

**Expanded tool picker coverage** — five additional tools now appear as selectable options across applicable tasks:

- **Cursor** (`cursor`): added to `code_explain`, `code_write`, `code_build`, `code_automate` (all complexities)
- **Claude Code** (`claudecode`): added to `code_explain`, `code_write` (already primary for `code_build` / `code_automate`)
- **GitHub Copilot** (`githubcopilot`): added to `code_explain`, `code_write`, `code_build`, `code_automate` (all complexities)
- **M365 Copilot** (`m365`): added to `write`, `analyze`, `design` (all complexities; was previously only surfaced as a fallback)
- **OpenAI Codex** (`codex`): already present in all four code tasks — no change needed

Tool strings and ratings per task/complexity are consistent with existing proxy-vendor patterns (Cursor, M365, GitHub Copilot use `isProxyNativeTool` to display specific mode names as-is).

---

## [2.0.0] — 2026-05-28

### Changed (major — structural refactor)

**User flow**: replaced the optional vendor filter (step 0) with a mandatory single-tool picker (step 3) inserted between use case and complexity. Users now explicitly select which tool they are using before complexity, enabling accurate per-tool recommendations and greener-alternative comparisons.

**State machine** (`decision-tree.js`):
- `state.vendors` (Set) → `state.vendor` (single string, e.g. `'claude'`, `'gemini'`)
- Removed multi-vendor logic, gap logic (GR-05), and `isFallbackInScope()`
- Tool picker resets when use case changes
- Hash routing updated: `vendors=…` → `vendor=…` (single value)
- Added `KNOWN_VENDORS` entry for `gemini`

**Rules** (`rules.js`):
- `resolveToolFromVendors()` → `resolveToolFromVendor(vendor, task)` — single vendor lookup
- Added `getAvailableVendors(task)` — returns vendor keys with entries for a given task
- Added `isGreenestOption(vendor, task, complexity)` — GR-04 comparison
- Added `getGreenestAlternative(vendor, task, complexity)` — finds the greenest option to display
- Added `RATING_ORDER` constant for numeric energy-tier comparisons
- Removed `isFallbackInScope()`

**UI** (`index.html`):
- Removed vendor filter chips (step 0)
- Added step 3 (tool picker) with single-select chips between use case and complexity; complexity relabelled step 4
- Result card: always shows usage tip for selected tool+task+complexity; shows "Greener alternative" section only when the selected tool's rating is worse than the best available for that task+complexity
- Removed gap card (GR-05) — no longer needed with single-tool selection

### Added (registry)

**`gemini` vendor** (`registry.js`):
- Added `gemini: 'Google Gemini'` to `vendorLabels`
- Added `gemini` vendorAlts to 8 tasks: `write`, `analyze`, `design`, `image_analyze`, `code_explain`, `code_write`, `code_build`, `code_automate`
- Complexity mapping: simple/moderate → Gemini 2.5 Flash (🟢); complex (general) → Gemini 2.5 Thinking (🔴); complex (code/math) → Gemini 2.1 Pro (🔴)

---

## [1.7.4] — 2026-05-27

### Added
- `image_analyze.*.vendorAlts.chatgpt`: when the ChatGPT vendor filter is active, all three complexity levels now resolve to `ChatGPT Auto (vision)` instead of falling through to the claude primary. Fallbacks point back to the claude vision equivalents (Haiku 4.5 for simple, Sonnet 4.6 for moderate/complex).
- `ChatGPT Auto (vision)` added to SPEC 2.1 — vision is native to the GPT-5.5 family and requires no mode change; the entry clarifies its scope (image Q&A, chart reading, visual analysis).

### Notes
- No rendering logic changes. `resolveNode` already checks `vendorAlts['chatgpt']` for non-code tasks via `ALT_ORDER`.

---

## [1.7.3] — 2026-05-27

### Fixed
- `vid_gen.nonai.tool`: `"Screen recording or stock footage"` → `"Screen recording"` — matches SPEC 2.10 canonical entry (GR-02).
- `vid_gen.simple.tool`: `"Slide-based animation (PowerPoint / Keynote)"` → `"Slide animation (PowerPoint / Keynote)"` — matches SPEC 2.10 (GR-02).
- Added `"Screen recording with voiceover"` to SPEC 2.10 — already used as `vid_gen.simple` fallback but missing from the spec table.

---

## [1.7.2] — 2026-05-27

### Fixed
- `img_gen_chat.nonai.tool`: `"Your existing images or photos"` → `"Personal or client-provided photos"` — matches SPEC 2.9 (GR-02).
- `img_gen_slides.nonai.tool`: `"Stock images or personal photos"` → `"Stock image library"` — matches SPEC 2.9 (GR-02).
- Added `"Built-in image editing (Photos / Snip & Sketch / Preview)"` to SPEC 2.9 — already used as `img_edit.nonai` primary but missing from the spec table.

---

## [1.7.1] — 2026-05-27

### Fixed
- Reasoning-mode entries re-rated to 🔴 Heavy: `GPT-5.5 Thinking` and `Claude Sonnet 4.6 (Extended Thinking)` were rated 🟡/🟠 in several nodes. Reasoning mode always carries the highest cost tier and must be 🔴 regardless of context.
- Affected nodes: `write.complex` (vendorAlts.chatgpt), `analyze.complex` (primary and vendorAlts.chatgpt), `design.complex` (vendorAlts.chatgpt).

---

## [2026-05-27] — Bug report button (no registry version bump)

### Added
- "🐛 Report a bug" button in `rec-actions` on all four result paths: media-gate non-AI result, no-AI result, GR-05 gap card, and normal recommendation card. Opens a Google Form in a new tab — no GitHub account required.

### Changed
- Replaced the original GitHub Issues modal (form fields, URL builder) with a direct `window.open()` call to the Google Form. Removed all modal CSS, HTML, and JS.

---

## [2026-05-27] — Structural changes (no registry version bump)

### Added
- `rules.js` — GR enforcement functions extracted from `index.html`: `resolveToolFromVendors`, `resolveNode`, `isFallbackInScope`. No logic changed.
- `decision-tree.js` — State management, input handlers, and hash routing extracted from `index.html`. No logic changed.
- `tests/gr-rules.test.js` — Rule validation test suite for GR-01 through GR-12. Run with `node tests/gr-rules.test.js`. 35 assertions; flags known violations without failing the exit code.

### Changed
- `index.html` inline script reduced to UI rendering only (`renderTaskStep`, `renderComplexityStep`, `renderResult`, etc.). Script load order: `registry.js` → `rules.js` → `decision-tree.js` → inline render script.
- SPEC 2.2 updated to Claude 4.x model names (Haiku 4.5, Sonnet 4.6, Sonnet 4.6 Extended Thinking). Open item 3.1 closed.
- SPEC 2.4 Cursor entries updated to use `Cursor (Model)` prefix format, matching registry strings.
- SPEC 2.12 platform-native entries updated: "Platform transcription" → "Platform-embedded transcription"; "Platform captioning" → "Platform-embedded captioning". Seven additional Teams Premium and Stream variant entries added to cover all registry fallback strings.

---

## [1.7.0] — 2026-05-27

v1.7.0 (2026-05-27) — Add vendorAlts.codex to all 12 code task entries; Codex now resolves correctly for code tasks when selected alongside non-coding vendors

---

## [1.6.0] — 2026-05-27

v1.6.0 (2026-05-27) — Model versions synced to 4.x; agentic and reasoning warnings strengthened; RESEARCH_NOTES added (Jegham et al. 2025)

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
