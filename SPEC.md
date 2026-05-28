# Recommendation Engine Spec

**AI Model Efficiency Guide**
Version 3 — May 2026

This document is the authoritative reference for the recommendation engine. It defines:
- The ground rules that constrain every recommendation (Section 1)
- The complete validated tool and model registry (Section 2)
- Open items flagged for future review (Section 3)

Claude Code and human contributors must read this document before modifying `registry.js` or the decision tree logic in `index.html`.

---

## Section 1 — Ground Rules

These are constraints, not preferences. Any recommendation that violates a ground rule is invalid regardless of how well the tool matches the task. GR-01 and GR-02 are hard gates evaluated first.

| ID | Rule | Description |
|----|------|-------------|
| GR-01 | Never recommend a filtered-out tool | If a tool was eliminated by any filter in the decision tree (vendor chip, task type, data sensitivity), it must not reappear as a primary recommendation or alternative for that session. |
| GR-02 | Only recommend from the validated tool list | All recommendations must resolve to a specific tool + model/mode pair from Section 2. Free-form model names are not valid outputs. |
| GR-03 | Alternatives must pass the same filters | Any fallback or alternative recommendation must satisfy all filters the primary recommendation passed. A filtered-out tool cannot be an alternative. |
| GR-04 | Rank by energy efficiency when capability is equivalent | When two options satisfy the task equally well, recommend the lighter/more efficient one. Efficiency is the tiebreaker, not performance. |
| GR-05 | Flag the gap, don't fabricate a fit | If no registry entry satisfies all active filters, surface the closest match and explicitly state what requirement it does not meet. Do not stretch a recommendation to fill a gap. |
| GR-06 | Respect access constraints | Do not recommend a tool the user has indicated is unavailable (license, policy, platform). Access filters are hard constraints, not preferences. |
| GR-07 | One primary recommendation per path | Each decision path terminates in exactly one primary recommendation. Alternatives are secondary and clearly labeled as such. |
| GR-08 | Model/mode specificity is required | A tool name alone is not a valid recommendation. The output must include the specific model or mode (e.g. "Claude Sonnet 4.6", not just "GitHub Copilot"). |
| GR-09 | No upselling to heavier models | The matrix must not recommend a more capable (and energy-intensive) model when a lighter one meets the requirements. Upselling is a logic error. |
| GR-10 | ChatGPT modes reflect enterprise workspace reality | For ChatGPT, valid choices are the GPT-5.5 family modes only. Do not recommend legacy models for enterprise ChatGPT users unless explicitly scoped to API/dev context. |
| GR-11 | Auto mode is the preferred default for proxy tools | For GitHub Copilot, M365 Copilot, and Cursor, Auto/auto-routing must be the default recommendation. Manual model selection is only appropriate when the user has a specific reason to override. |
| GR-12 | Non-AI is the default recommendation for image and video generation | For image and video generation tasks, the primary recommendation must always be a non-AI alternative (stock images, personal photos, existing media, screen recordings, professional production). An AI model is only recommended if the user explicitly confirms no non-AI alternative is available. The recommendation output must reflect this — "Non-AI" appears as the primary choice, not as a footnote. The rationale must not minimize the energy impact of AI generation. |

---

## Section 2 — Tool & Model Registry

All valid recommendation outputs. `registry.js` is the implementation of this registry. The matrix may only recommend tool + model/mode pairs listed here.

**Key principles:**
- Auto/auto-routing is always the recommended default for proxy tools (GitHub Copilot, M365 Copilot, Cursor)
- Lighter models are preferred when they meet task requirements — heavier models require justification
- Platform-native options have zero incremental AI cost and must be surfaced first when available
- For image and video generation, Non-AI/Stock is always the primary recommendation (GR-12)

---

### 2.1 ChatGPT (Enterprise)

> GPT-5.5 family only for enterprise workspace users. Legacy GPT-4o and o3-mini do not apply in this context.

| Model / Mode | Cost tier | When to use |
|---|---|---|
| **Auto** | — | Default for all tasks. System routes between Instant and Thinking. Always start here. |
| GPT-5.5 Instant | Standard | Fast, efficient. Routine tasks — writing, summarizing, Q&A. |
| GPT-5.5 Thinking | Higher | Complex reasoning, analysis, multi-step problems. Use only when Auto is insufficient. |
| Pro Reasoning mode | Highest | Reserve for hardest analytical tasks. Admin must enable. |

---

### 2.2 Claude

> Direct Claude access (claude.ai or API). Updated to Claude 4.x — open item 3.1 resolved.

| Model / Mode | Cost tier | When to use |
|---|---|---|
| **Claude Haiku 4.5** | Lowest | Lightest model. Short text, emails, summaries, label generation. |
| Claude Haiku 4.5 (vision) | Lowest | Simple image Q&A, object classification. No reasoning overhead. |
| Claude Sonnet 4.6 | Mid | Multi-step drafts, structured documents, multi-document analysis. |
| Claude Sonnet 4.6 (vision) | Mid | Charts, document images, detailed image analysis. |
| Claude Sonnet 4.6 (Extended Thinking) | High | Extended reasoning. Complex analytical tasks, structured problem-solving. |

---

### 2.3 Claude Code

| Model / Mode | Cost tier | When to use |
|---|---|---|
| **Claude Code (Haiku model)** | Lowest | Lightest coding mode. Code Q&A, simple completions. |
| Claude Code (Haiku, agent mode) | Low | Agentic tasks with Haiku. Light automation, single-file edits. |
| Claude Code (Sonnet model) | Mid | Multi-step code generation, refactoring, moderate complexity. |
| Claude Code (Sonnet, agent mode) | Mid-high | Agentic coding. Multi-file, complex automation workflows. |

---

### 2.4 Cursor

> 138+ models available in Cursor. This registry lists efficiency-first choices only. Claude Opus and GPT-5.5 are excluded. Auto is always the preferred default.

| Model / Mode | Cost tier | When to use |
|---|---|---|
| **Auto** | — | Always the preferred default. Cursor's router selects the cheapest model capable of handling the task. Effectively unlimited on paid plans. |
| Composer 1.5 | Native / Low | Cursor's own model. Fast, accurate, generous usage allocation. Best starting point when a specific model is needed. |
| Composer 2 | Low (~1/10 Opus) | Frontier-level coding at ~$0.50/M input tokens. Use for complex multi-file tasks when Composer 1.5 is insufficient. |
| GPT-5.2 Codex | Low-mid | Efficient third-party alternative when a different model perspective is needed. |
| Claude Sonnet 4.5 / 4.6 | Mid | Best option for writing and documentation tasks within Cursor. Also strong for mixed code+prose work. |

---

### 2.5 GitHub Copilot (Business / Enterprise)

> Efficiency-first model selection only. Auto is always preferred. GPT-5.5 (7.5× multiplier) and Opus variants excluded.

| Model / Mode | Cost tier | When to use |
|---|---|---|
| **Auto** | — | Always the preferred default. System selects from eligible models; 10% discount on premium multipliers. |
| GPT-5.3-Codex | 1× (LTS) | Base model. Routine coding tasks. Guaranteed available through Feb 2027. |
| GPT-5.4-mini | 0.33× | Lightweight agent tasks. Fastest, most efficient option for simple changes. |
| Claude Haiku 4.5 | 0.33× | Lightweight agent tasks via Anthropic path. Equivalent efficiency to GPT-5.4-mini. |
| Claude Sonnet 4.6 | Mid | Moderate complexity. Use when base model is insufficient and heavier models are not justified. |

---

### 2.6 M365 Copilot — Word

> Three modes only. Anthropic model support coming summer 2026 — not yet included.

| Model / Mode | Cost tier | When to use |
|---|---|---|
| **Auto** | — | Default. System routes between Quick Response and Think Deeper based on prompt complexity. |
| Quick Response | Lower | Fast drafts, routine edits, simple rewrites. Prioritizes speed. |
| Think Deeper | Higher | Complex documents, multi-step reasoning, analytical writing. Reserve for tasks where Auto is insufficient. |

---

### 2.7 M365 Copilot — Excel

> Anthropic models enabled by default from May 4, 2026. Auto is always the preferred starting point.
> ⚠️ Open item 3.5: Claude Opus models process data outside the EU Data Boundary — a warning is needed for EU-based clients (not yet implemented).

| Model / Mode | Cost tier | When to use |
|---|---|---|
| **Auto** | — | Default. System routes to the appropriate model. Always start here. |
| GPT-5.4 | Standard | Efficient general-purpose model for formulas, data analysis, and structured outputs. |
| GPT-5.5 | Higher | More capable. Use for complex multi-step analysis when GPT-5.4 is insufficient. |
| Claude Opus 4.6 | High | Anthropic reasoning model. Complex analytical tasks requiring deeper reasoning. |
| Claude Opus 4.7 | Highest | Latest Anthropic reasoning model. Reserve for the most complex analytical workflows. |

---

### 2.8 M365 Copilot — PowerPoint

> Anthropic models enabled by default from May 4, 2026. Auto is always the preferred starting point.
> ⚠️ Open item 3.5: Claude Opus models process data outside the EU Data Boundary — a warning is needed for EU-based clients (not yet implemented).

| Model / Mode | Cost tier | When to use |
|---|---|---|
| **Auto** | — | Default. System selects model. Preferred for most slide generation tasks. |
| GPT-5.4 | Standard | Efficient slide generation, layout suggestions, content structuring. |
| GPT-5.5 | Higher | Higher quality output for complex decks. Use when GPT-5.4 falls short. |
| Claude Opus 4.6 | High | Anthropic model for richer content generation and nuanced narrative. |
| Claude Opus 4.7 | Highest | Latest Anthropic model. Reserve for high-stakes, client-facing presentations. |

---

### 2.9 Image Generation

> ⛔ GR-12 applies. Non-AI is the primary recommendation. AI models are fallback only — gated by explicit user confirmation that no non-AI alternative exists.

| Tool / Mode | Cost tier | When to use |
|---|---|---|
| **Stock image library** | Zero | PRIMARY RECOMMENDATION. Use stock images, personal photos, or existing assets. No AI inference cost. |
| **Personal or client-provided photos** | Zero | PRIMARY RECOMMENDATION. Always preferred over AI generation. |
| DALL-E 3 (standard quality) | High | AI FALLBACK ONLY. Use only when user confirms no non-AI alternative exists. Standard quality required — never HD by default. |
| DALL-E 3 (HD) | Very High | AI FALLBACK ONLY. Reserve for final client-facing deliverables where standard quality is insufficient and no non-AI option exists. |
| DALL-E 3 (inpainting, standard) | High | AI FALLBACK ONLY. Targeted edits to existing images when non-AI editing tools cannot achieve the result. |
| Gemini Flash (Image) | High | AI FALLBACK ONLY. Lower-cost AI image generation when DALL-E is unavailable and no non-AI option exists. |
| Gemini Pro (Image) | Very High | AI FALLBACK ONLY. Higher fidelity. Use only when Flash is insufficient and no non-AI option exists. |

---

### 2.10 Video Generation

> ⛔ GR-12 applies. Non-AI is the primary recommendation. AI models are fallback only. Video AI generation carries the highest energy cost in this registry.

| Tool / Mode | Cost tier | When to use |
|---|---|---|
| **Stock footage** | Zero | PRIMARY RECOMMENDATION. Always prefer over AI video generation. |
| **Screen recording** | Zero | PRIMARY RECOMMENDATION. For product demos, tutorials, and walkthroughs. Zero AI cost. |
| **Stock footage + motion graphics** | Zero | PRIMARY RECOMMENDATION. Achieves comparable results for presentations and training content. |
| **Professional video production** | Zero | PRIMARY RECOMMENDATION. Highest quality, zero AI inference cost. |
| Slide animation (PowerPoint / Keynote) | Zero | PRIMARY RECOMMENDATION. For simple video needs — zero AI cost, zero new assets required. |

> No AI video generation tool (Veo or equivalent) is included in the current enterprise shortlist. If a user confirms no non-AI alternative is available, surface this gap explicitly per GR-05.

---

### 2.11 Gemini (Google) — Text & Slides

> Image generation entries are in Section 2.9. These entries cover text and Google Slides use cases only.

| Model / Mode | Cost tier | When to use |
|---|---|---|
| **Gemini Flash 2.0** | Lowest | Fast, efficient. Routine text tasks, research with search grounding. |
| Gemini Pro 1.5 | Mid | Large context window. Multi-document analysis. |
| Google Slides (Gemini Flash) | Low | Lightweight generation integrated in Google Slides. |
| Google Slides (Gemini Pro Image) | Mid | Higher fidelity for complex visual compositions in Slides. Confirm non-AI layout options first. |

---

### 2.12 Platform-Native (Zero AI Cost)

> Always surface these first. No additional model call, no incremental energy cost.

| Tool / Mode | Cost tier | When to use |
|---|---|---|
| Platform transcription (Teams / Zoom / Meet) | Zero | No additional model call. Always prefer over standalone tools when available. |
| Platform captioning (Teams / Zoom) | Zero | Native captioning. No file upload or extra model required. |
| PowerPoint Designer (non-AI layouts) | Zero | Zero AI cost. Use for layout when content is ready. |
| Microsoft Stream (auto-transcription) | Zero | Platform-native transcription. No additional model call needed. |

---

## Section 3 — Open Items

| # | Item | Status |
|---|------|--------|
| 3.1 | **Claude versions** — Updated to Haiku 4.5, Sonnet 4.6, Sonnet 4.6 (Extended Thinking) in Section 2.2. | Resolved |
| 3.3 | **GitHub Copilot — admin policy warning** — Non-base models require admin enablement. Confirm whether the tool should surface a warning when recommending any model other than GPT-5.3-Codex or Auto. | Open |
| 3.4 | **M365 Word — Anthropic timeline** — Anthropic model support for Word expected summer 2026. When live, Word should adopt the same model list as Excel and PowerPoint. Flag for registry update. | Open |
| 3.5 | **EU data boundary** — Claude Opus in M365 Excel/PowerPoint processes data outside the EU Data Boundary. Recommendations involving these models should carry a data residency warning for EU-based clients. Not yet implemented. | Open |
| 3.6 | **Image/video gate question** — GR-12 requires a gate question before any image or video generation path. Gate is implemented for `img_gen_chat`, `img_gen_slides`, `img_edit`, and `vid_gen`. Confirm wording and placement are correct across all paths. | Implemented — confirm |

---

## Registry maintenance

The registry is versioned in `registry.js` using `REGISTRY_VERSION` (semver) and `REGISTRY_LAST_UPDATED`. All changes are logged in `CHANGELOG.md`.

**Review triggers:**

| Trigger | Typical action |
|---------|---------------|
| Major model release (OpenAI, Anthropic, Google, Microsoft) | Check efficiency-first ordering; update model names and cost tiers |
| M365 Copilot model availability change | Update `m365OfficeModels`; update fallbacks on affected task nodes |
| GitHub Copilot model policy change | Update `githubCopilotModels`; check multipliers |
| Cursor native model change (Composer series) | Update Cursor fallback entries in `code_build` and `code_automate` |
| Platform-native tool change | Update `transcribe` and `vid_caption` entries |
| Quarterly cadence | Review all entries; focus on `lastValidated` dates older than 90 days |

**Automated monitoring:** A GitHub Action runs weekly and opens issues when model changes are detected in vendor documentation. See `CHANGELOG.md` and `.github/workflows/registry-watch.yml`.

---

*Spec version: 3 — May 2026*
*Registry version: 1.6.0*
