# AI Model Efficiency Guide

**Choose the right AI tool for the task — and the planet.**

An interactive decision tree that helps you select the most energy-efficient AI tool for your task — across writing, analysis, code, images, audio, and video.

🔗 **Live tool:** [tools.itclimateed.com](https://tools.itclimateed.com)

---

## What it does

The tool walks you through a short set of questions — task type, vendor access, complexity — and recommends the most energy-efficient AI tool and model for your specific situation.

Key principles built into the recommendation engine:

- Lighter models are always preferred when they meet task requirements  
- Non-AI alternatives (stock images, platform-native tools) are surfaced first for high-energy task types  
- Auto/routing modes are the default for proxy tools (GitHub Copilot, M365 Copilot, Cursor)  
- Filtered vendors never appear in recommendations or fallbacks

Supported tools: ChatGPT, Claude, Claude Code, Cursor, GitHub Copilot, M365 Copilot (Word, Excel, PowerPoint), Gemini, and DALL-E — plus non-AI alternatives for image and video tasks.

---

## Repository structure

```
index.html                  Main application (decision tree, UI, recommendation logic)
registry.js                 Recommendation data — the authoritative model/tool registry
model-snapshot.json         Baseline model list for the automated registry watch action
CHANGELOG.md                Registry update history
README.md                   This file
scripts/registry-watch.js   Weekly model change detector (run by GitHub Action)
.github/workflows/
  registry-watch.yml        GitHub Action — runs every Monday at 08:00 UTC
```

`registry.js` is loaded as a separate script by `index.html`. All recommendation data lives in the registry; UI logic lives in `index.html`.

---

## How to run locally

No build step required. The tool is a single HTML file.

git clone https://github.com/pascaljoly/ai-efficiency-app.git

cd ai-efficiency-app

open index.html   \# or serve with any static server

To serve with Python:

python3 \-m http.server 8080

\# then open http://localhost:8080

---

## Deployment

The tool deploys automatically to GitHub Pages on push to `main`.

Live URL: [tools.itclimateed.com](https://tools.itclimateed.com)

---

## Updating the tool registry

The registry is the list of valid AI tools and models the engine can recommend. It lives in `registry.js`..

**Before making any registry change**, read [SPEC.md](http://SPEC.md) — specifically:

- **Section 1 (Ground Rules):** constraints every recommendation must satisfy  
- **Section 2 (Tool & Model Registry):** the current validated list of tools and models

**To add or update a tool or model:**

1. Check that the tool/model is confirmed available in enterprise contexts  
2. Add it to the appropriate vendor group in `registry.js`  
3. Ensure the entry includes: vendor tag, tool name, model/mode, cost tier, and when-to-use rationale  
4. Verify it does not violate any ground rule (especially GR-09: no upselling)  
5. Update `CHANGELOG.md` with the change and date  
6. Update the `REGISTRY_VERSION` and `last_updated` fields in `registry.js`

**Registry review cadence:** quarterly, or on any of these triggers: major model release from OpenAI, Anthropic, Google, or Microsoft; change to M365 Copilot model availability (Word, Excel, PowerPoint); GitHub Copilot model policy change; Cursor native model change. See `CHANGELOG.md` for the full trigger table.

---

## Specification

The full recommendation engine spec — ground rules, tool registry, and open items — is in SPEC.md.

It covers:

- 12 ground rules that constrain all recommendations  
- The complete validated tool and model list, grouped by vendor  
- Open items flagged for future review

---

## Contributing

Contributions welcome. The most useful contributions right now:

- **Registry updates:** new models, updated modes, corrected cost tiers  
- **Decision tree improvements:** better task categorization, cleaner question flow  
- **Bug fixes:** recommendation logic errors, UI issues

Please open an issue before making significant changes to the recommendation logic or ground rules. Changes that affect GR-12 (Non-AI as primary for image/video generation) require explicit sign-off.

---

## Automated Registry Watch

A GitHub Action runs every Monday at 08:00 UTC (and on manual trigger) to detect model changes on vendor documentation pages.

**What it does:**
- Fetches the documentation page for each monitored vendor
- Extracts model identifiers using vendor-specific parsers
- Diffs extracted names against `model-snapshot.json` (the committed baseline)
- Opens a GitHub issue labelled `registry-update` if new or removed models are detected
- Commits an updated `model-snapshot.json` after each run

**What it does NOT do:**
- Never modifies `registry.js`
- Never opens a PR against the registry
- Never classifies a model as efficient or inefficient — that is always a human judgment call

**Monitored vendors:** Anthropic, OpenAI. GitHub Copilot, M365 Copilot, Cursor, and Google Gemini parsers are planned — see `scripts/registry-watch.js` for implementation status.

**`model-snapshot.json`** is the baseline model list committed to the repo. It is updated automatically by the action after each successful run. Do not edit it manually — your changes will be overwritten on the next run.

To trigger an ad-hoc check: go to **Actions → Registry Watch → Run workflow**.

---

## About

Built by [IT Climate Ed](https://itclimateed.com) as part of a sustainability consulting practice focused on sustainable AI and IT. The tool is designed to help enterprise teams — in tech, government, and financial services — reduce the energy footprint of their AI usage without sacrificing productivity.

---

*Registry last updated: May 2026 — see CHANGELOG.md*  
