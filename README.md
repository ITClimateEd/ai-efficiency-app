# AI Model Efficiency Guide

**Choose the right AI tool for the task — and the planet.**

An interactive decision tree that helps you select the most energy-efficient AI tool and model for your task — across writing, analysis, code, images, audio, and video.

🔗 **Live tool:** [tools.itclimateed.com](https://tools.itclimateed.com)

---

## What it does

The tool walks you through a short set of questions — task type, vendor access, complexity — and recommends the most energy-efficient AI tool and model for your situation.

Key principles built into the recommendation engine:

- **Non-AI first for image and video.** Stock images, personal photos, screen recordings, and existing media are always the primary recommendation. AI generation only appears when the user confirms no non-AI alternative exists.
- **Lightest model that meets the task.** The engine never upsells to a heavier model when a lighter one is sufficient.
- **Auto by default for proxy tools.** GitHub Copilot, M365 Copilot, and Cursor default to Auto/routing mode — manual model selection is secondary.
- **Filtered vendors stay filtered.** A vendor excluded by the user never reappears in recommendations or fallbacks.
- **Gaps are named, not papered over.** If no match exists for a vendor + task combination, the engine surfaces the gap explicitly.

Supported tools: ChatGPT (Enterprise), Claude, Claude Code, Cursor, GitHub Copilot, M365 Copilot (Word, Excel, PowerPoint), Gemini — plus non-AI alternatives for image and video tasks.

---

## Repository structure

```
index.html              Main application — decision tree UI and recommendation logic
registry.js             Tool and model registry — the authoritative list of valid recommendations
model-snapshot.json     Vendor model snapshot used by the automated registry watch
SPEC.md                 Recommendation engine spec (ground rules + registry rationale)
CHANGELOG.md            Registry update history
scripts/
  registry-watch.js     Automated model change detection script
.github/workflows/
  registry-watch.yml    GitHub Action — runs weekly, opens issues on detected changes
README.md               This file
```

---

## How to run locally

No build step required. The tool is a single HTML file with an external registry.

```bash
git clone https://github.com/ITClimateEd/ai-efficiency-app.git
cd ai-efficiency-app
open index.html   # or serve with any static server
```

To serve with Python:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## Deployment

The tool deploys automatically to GitHub Pages on push to `main`.

Live URL: [tools.itclimateed.com](https://tools.itclimateed.com)

---

## Updating the registry

The registry lives in `registry.js`. It is the single source of truth for all recommendation outputs — the UI reads from it and never contains hardcoded tool or model names.

**Before making any registry change**, read [SPEC.md](SPEC.md):

- **Section 1 (Ground Rules):** 12 constraints every recommendation must satisfy
- **Section 2 (Tool & Model Registry):** the current validated list, grouped by vendor

**To add or update a tool or model:**

1. Confirm the tool/model is available in enterprise contexts (not just announced)
2. Add or update the entry in the appropriate vendor group in `registry.js`
3. Every entry must include: `vendor` tag, tool name, model/mode, cost tier, and `lastValidated` date
4. Verify the change does not violate any ground rule — especially:
   - GR-09: do not add a heavier model when a lighter one already meets the task
   - GR-12: non-AI must remain the primary recommendation for image and video generation
5. Bump `REGISTRY_VERSION` (patch = correction, minor = new model/mode, major = structural change)
6. Update `REGISTRY_LAST_UPDATED` to today's date
7. Add an entry to `CHANGELOG.md`

**Registry review cadence:** quarterly, or on any major model release. See the review triggers table in [CHANGELOG.md](CHANGELOG.md).

---

## Automated registry watch

A GitHub Action runs every Monday at 08:00 UTC and monitors vendor documentation pages for model changes:

| Vendor | What is monitored |
|--------|-------------------|
| Anthropic | Model releases and deprecations |
| OpenAI | GPT family changes, ChatGPT enterprise updates |
| GitHub Copilot | Available models, model policy changes |
| M365 Copilot | Model availability in Word, Excel, PowerPoint |
| Cursor | Native model releases (Composer series) |
| Google Gemini | Model releases and deprecations |

When a change is detected, the action opens a GitHub issue with the vendor, source URL, added/removed model names, relevant ground rules to check, and a recommended action. **The action never modifies `registry.js`** — all registry changes require human review.

The current model snapshot is stored in `model-snapshot.json` and updated automatically after each run.

To trigger a manual check:

```
GitHub → Actions → Registry Watch → Run workflow
```

---

## Specification

The full recommendation engine spec is in [SPEC.md](SPEC.md). It covers:

- 12 ground rules that constrain all recommendations
- The complete validated tool and model list, grouped by vendor
- Open items flagged for future review

---

## Contributing

Contributions welcome. The most useful contributions right now:

- **Registry updates:** new models, updated modes, corrected cost tiers
- **Decision tree improvements:** better task categorization, cleaner question flow
- **Parser improvements:** better model extraction in `scripts/registry-watch.js` for M365 and GitHub Copilot pages
- **Bug fixes:** recommendation logic errors, UI issues

Please open an issue before making significant changes to the recommendation logic or ground rules. Changes that affect **GR-12** (Non-AI as primary for image/video generation) require explicit sign-off from the maintainer.

---

## About

Built by [IT Climate Ed](https://itclimateed.com) as part of a sustainability consulting practice focused on sustainable AI and IT. The tool helps enterprise teams — in tech, government, and financial services — reduce the energy footprint of their AI usage without sacrificing productivity.

Enterprise teams looking to go deeper can reach out at [itclimateed.com](https://itclimateed.com) for workshops and consulting engagements.

---

*Registry version: 1.3.0 — last updated May 22, 2026 — see [CHANGELOG.md](CHANGELOG.md)*
