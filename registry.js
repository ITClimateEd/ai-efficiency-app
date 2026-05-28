// registry.js — AI Model Efficiency Guide recommendation data
// Maintained independently of UI logic. All recommendation lookups reference this file.

// Bump REGISTRY_VERSION on every registry change (patch = correction, minor = new model/mode, major = structural)
// Update REGISTRY_LAST_UPDATED and add an entry to CHANGELOG.md at the same time.
const REGISTRY_VERSION      = '2.0.0';
const REGISTRY_LAST_UPDATED = '2026-05-28';

const RESEARCH_NOTES = {
  primarySource: 'Jegham et al. (2025) — How Hungry is AI? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference. arXiv:2505.09598',
  keyFindings: [
    'Most energy-intensive models exceed 29 Wh per long prompt — 65x the most efficient systems',
    'Inference accounts for up to 90% of total AI lifecycle energy — model selection at query time is the highest-leverage intervention',
    'Prompt length is a primary cost driver — short queries at scale aggregate to significant annual consumption',
    'Reasoning models cost disproportionately more — activate only when task complexity justifies it',
    'Agentic workflows multiply inference cost — each tool call or loop iteration is a separate model request',
  ],
  limitation: 'Energy ratings in this registry reflect relative compute cost (model size + reasoning overhead). Water and carbon footprints vary by provider datacenter and are not currently surfaced per recommendation.',
};

const vendorLabels = {
  chatgpt: 'ChatGPT', claude: 'Claude', gemini: 'Google Gemini', codex: 'Codex',
  claudecode: 'Claude Code', cursor: 'Cursor',
  m365: 'M365 Copilot', githubcopilot: 'GitHub Copilot',
};

// Vendors that are only valid for code output tasks.
// These are excluded from vendor resolution for text/image/audio/video tasks (GR-01/GR-03).
const codeOnlyVendors = ['codex', 'claudecode', 'cursor'];

const tasks = {
  text: [
    { id:'write',         label:'Write (email, post, summary, draft)' },
    { id:'analyze',       label:'Analyze / research' },
    { id:'design',        label:'Design / prototype (spec, brief, UX flow)' },
    { id:'image_analyze', label:'Analyze an image (text output)' },
  ],
  image: [
    { id:'img_gen_chat',   label:'Generate image in a chatbot' },
    { id:'img_gen_slides', label:'Generate image in a slide presentation' },
    { id:'img_edit',       label:'Edit / transform existing image' },
  ],
  audio: [{ id:'transcribe', label:'Transcribe audio or meeting' }],
  video: [
    { id:'vid_caption', label:'Transcribe / caption video' },
    { id:'vid_gen',     label:'Generate video' },
  ],
  code: [
    { id:'code_explain',  label:'Explain / review code' },
    { id:'code_write',    label:'Write / debug' },
    { id:'code_build',    label:'Build (interactive — you stay in control)' },
    { id:'code_automate', label:'Automate / workflow (agentic)' },
  ],
};

const ratings = {
  '🟢': { label:'Lightest', cls:'badge-green'  },
  '🟡': { label:'Light',    cls:'badge-yellow' },
  '🟠': { label:'Moderate', cls:'badge-orange' },
  '🔴': { label:'Heavy',    cls:'badge-red'    },
  '🟣': { label:'Heaviest', cls:'badge-purple' },
};

// GitHub Copilot proxy model shortlist — efficiency-first order (GR-09).
// Auto is mandatory first entry per GR-11; renderResult() displays "Auto" for proxy vendors
// unless the registry tool string already names a specific mode.
// multiplier is relative to GPT-5.3-Codex LTS (1.0 = baseline).
// null = dynamic (Auto) or not yet quantified.
// TODO (open item 3.3): surface an admin policy warning when a non-base model is selected —
//   org policy may restrict third-party model routing (Claude Haiku 4.5, Claude Sonnet 4.6)
//   outside of the Auto / GPT-5.3-Codex LTS path. Wire warning in WI-09 efficiency display.
const githubCopilotModels = [
  { id:'auto',          label:'Auto',             multiplier:null, note:'Always the default; system routes to the most efficient eligible model' },
  { id:'gpt53codex',    label:'GPT-5.3-Codex',    multiplier:1.0,  note:'LTS baseline — predictable cost for production workflows' },
  { id:'gpt54mini',     label:'GPT-5.4-mini',      multiplier:0.33, note:'Lightest option; best for inline completions and simple tasks' },
  { id:'claudeHaiku45', label:'Claude Haiku 4.5',  multiplier:0.33, note:'Efficient third-party alternative for fast completions and code explanation' },
  { id:'claudeSonnet46',label:'Claude Sonnet 4.6', multiplier:null, tier:'mid', note:'Mid-tier third-party; use for moderately complex code tasks' },
  // GPT-5.5 (7.5x) and Opus variants are excluded — cost too high for standard enterprise use
];

// M365 Copilot Excel and PowerPoint model list — efficiency-first order (GR-09).
// Auto is mandatory first entry per GR-11; renderResult() displays "Auto" for proxy vendors
// unless the registry tool string already names a specific mode (e.g. "Think Deeper").
// Anthropic models (Claude Opus 4.6 and 4.7) enabled by default since May 4, 2026
// per Microsoft announcement. EU data boundary constraints may apply — see open item 3.5.
// TODO (open item 3.5): surface an EU data boundary warning when Claude Opus 4.6 or 4.7
//   is surfaced in the Excel / PowerPoint vendor path. Wire warning in WI-09 display.
// Note: Excel recommendations align with the analyze/* task nodes; PowerPoint with img_gen_slides.
const m365OfficeModels = [
  { id:'auto',         label:'Auto',             note:'Always the default; routes to the most efficient eligible model' },
  { id:'gpt54',        label:'GPT-5.4',           note:'Microsoft-native; standard analytical and presentation tasks' },
  { id:'gpt55',        label:'GPT-5.5',           note:'Higher capability; use only when Auto is insufficient' },
  { id:'claudeOpus46', label:'Claude Opus 4.6',   note:'Anthropic model; strong structured reasoning for complex data and slide composition' },
  { id:'claudeOpus47', label:'Claude Opus 4.7',   note:'Latest Anthropic model; highest capability in the Opus family for Excel and PowerPoint' },
];

// NOTE (M365 Copilot Word — summer 2026): Anthropic model support is coming to M365 Copilot Word
// in summer 2026. When available, Word entries (write, analyze, design) should be updated to
// surface Claude Haiku / Sonnet as explicit mode alternatives alongside Auto / Quick Response /
// Think Deeper. Revisit all write.*, analyze.*, and design.* fallback entries at that point.
// vendor: one of the KNOWN_VENDORS ids, or null for platform-agnostic / non-AI tools.
// null = always show regardless of vendor filter (GR-01/GR-03).
const recommendations = {
  write: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 4.5', vendor:'claude',
      reason:'Lightweight model purpose-built for short, clear text — no reasoning overhead needed for emails, summaries, or label generation.',
      fallback:{ tool:'M365 Copilot Word (Auto)', vendor:'m365', reason:'Auto selects the most efficient Word mode for short drafts, emails, and summaries — no model configuration needed.' },
      lastValidated:'2026-05-27',
      vendorAlts:{
        chatgpt:{ tool:'ChatGPT Auto', rating:'🟢', reason:'Auto routing selects the efficient tier for short text — no manual model configuration required.', fallback:{ tool:'M365 Copilot Word (Auto)', vendor:'m365', reason:'Auto selects the most efficient Word mode for short drafts, emails, and summaries — no model configuration needed.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Lightweight and fast for short, clear text — no reasoning overhead for emails, summaries, or brief drafts.' },
      },
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 4.6', vendor:'claude',
      reason:'Mid-tier model handles multi-step drafts and tone adjustment without reaching for a reasoning model.',
      fallback:{ tool:'M365 Copilot Word (Quick Response)', vendor:'m365', reason:'Quick Response handles multi-step drafts and tone adjustments with minimal processing overhead.' },
      lastValidated:'2026-05-27',
      vendorAlts:{
        chatgpt:{ tool:'ChatGPT Auto', rating:'🟡', reason:'Auto handles multi-step drafts and tone adjustments — reasoning mode activates only when needed.', fallback:{ tool:'M365 Copilot Word (Quick Response)', vendor:'m365', reason:'Quick Response handles multi-step drafts and tone adjustments with minimal processing overhead.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Handles multi-step drafts and tone adjustments without reaching for a reasoning model.' },
      },
    },
    complex: {
      rating:'🟠', tool:'Claude Sonnet 4.6', vendor:'claude',
      reason:'Extended thinking activates only for nuanced judgment — avoids the energy cost of a full frontier reasoning model. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.',
      fallback:{ tool:'M365 Copilot Word (Think Deeper)', vendor:'m365', reason:'Think Deeper applies extended reasoning for complex drafts requiring nuanced judgment — no manual model selection. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.' },
      lastValidated:'2026-05-27',
      vendorAlts:{
        chatgpt:{ tool:'GPT-5.5 Thinking', rating:'🔴', reason:'Thinking mode provides targeted reasoning for complex drafts with nuanced judgment — lower overhead than always-on reasoning. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.', fallback:{ tool:'M365 Copilot Word (Think Deeper)', vendor:'m365', reason:'Think Deeper applies extended reasoning for complex drafts requiring nuanced judgment — no manual model selection. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.' } },
        gemini: { tool:'Gemini 2.5 Thinking', rating:'🔴', reason:'Extended thinking activates on demand for nuanced, long-form drafts — more targeted than always-on reasoning. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.' },
      },
    },
  },
  analyze: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 4.5', vendor:'claude',
      reason:'Factual lookups and single-source summaries are well within a small model\'s capability — no reasoning loop needed.',
      fallback:{ tool:'M365 Copilot Word (Auto)', vendor:'m365', reason:'Auto mode handles factual lookups and single-source summaries efficiently within Word.' },
      lastValidated:'2026-05-27',
      vendorAlts:{
        chatgpt:{ tool:'ChatGPT Auto', rating:'🟢', reason:'Auto routes simple factual lookups and single-source summaries to the fast tier automatically.', fallback:{ tool:'M365 Copilot Word (Auto)', vendor:'m365', reason:'Auto mode handles factual lookups and single-source summaries efficiently within Word.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Handles factual lookups and single-source summaries efficiently — no reasoning loop needed.' },
      },
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 4.6', vendor:'claude',
      reason:'Handles multi-source synthesis and structured comparison without triggering a reasoning loop.',
      fallback:{ tool:'M365 Copilot Word (Quick Response)', vendor:'m365', reason:'Quick Response covers multi-source synthesis and structured comparison within Word.' },
      lastValidated:'2026-05-27',
      vendorAlts:{
        chatgpt:{ tool:'ChatGPT Auto', rating:'🟡', reason:'Auto handles multi-source synthesis and structured comparison without overprovisioning.', fallback:{ tool:'M365 Copilot Word (Quick Response)', vendor:'m365', reason:'Quick Response covers multi-source synthesis and structured comparison within Word.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Covers multi-source synthesis and structured comparison without overprovisioning.' },
      },
    },
    complex: {
      rating:'🔴', tool:'Claude Sonnet 4.6 (Extended Thinking)', vendor:'claude',
      reason:'Reasoning activates on demand for deep synthesis — more efficient than routing a standard query to a frontier model by default. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.',
      fallback:{ tool:'M365 Copilot Word (Think Deeper)', vendor:'m365', reason:'Think Deeper applies extended reasoning for deep synthesis — no manual model selection required. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.' },
      lastValidated:'2026-05-27',
      vendorAlts:{
        chatgpt:{ tool:'GPT-5.5 Thinking', rating:'🔴', reason:'Thinking mode activates on demand for deep synthesis — more efficient than routing every query to a frontier model by default. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.', fallback:{ tool:'M365 Copilot Word (Think Deeper)', vendor:'m365', reason:'Think Deeper applies extended reasoning for deep synthesis — no manual model selection required. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.' } },
        gemini: { tool:'Gemini 2.5 Thinking', rating:'🔴', reason:'Extended thinking activates on demand for deep synthesis — more efficient than always routing to a frontier model. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.' },
      },
    },
  },
  design: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 4.5', vendor:'claude',
      reason:'Spec writing and design briefs are structured text tasks — a small model handles them without overprovisioning.',
      fallback:{ tool:'M365 Copilot Word (Auto)', vendor:'m365', reason:'Auto mode handles simple specs and design briefs within Word.' },
      lastValidated:'2026-05-27',
      vendorAlts:{
        chatgpt:{ tool:'ChatGPT Auto', rating:'🟢', reason:'Auto handles simple specs and design briefs without reasoning overhead.', fallback:{ tool:'M365 Copilot Word (Auto)', vendor:'m365', reason:'Auto mode handles simple specs and design briefs within Word.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Handles simple specs and design briefs efficiently — no reasoning overhead for structured text.' },
      },
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 4.6', vendor:'claude',
      reason:'Handles iterative design documents and system specs efficiently — mid-tier is well matched for this output type.',
      fallback:{ tool:'M365 Copilot Word (Quick Response)', vendor:'m365', reason:'Quick Response handles iterative design documents and system specs efficiently.' },
      lastValidated:'2026-05-27',
      vendorAlts:{
        chatgpt:{ tool:'ChatGPT Auto', rating:'🟡', reason:'Auto handles iterative design documents and system specs without overprovisioning.', fallback:{ tool:'M365 Copilot Word (Quick Response)', vendor:'m365', reason:'Quick Response handles iterative design documents and system specs efficiently.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Handles iterative design documents and system specs efficiently at minimal compute cost.' },
      },
    },
    complex: {
      rating:'🟠', tool:'Claude Sonnet 4.6', vendor:'claude',
      reason:'Extended thinking supports multi-system design with interdependencies — no need for a frontier model. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.',
      fallback:{ tool:'M365 Copilot Word (Think Deeper)', vendor:'m365', reason:'Think Deeper supports complex multi-system design with interdependencies — use for documents requiring structured reasoning. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.' },
      lastValidated:'2026-05-27',
      vendorAlts:{
        chatgpt:{ tool:'GPT-5.5 Thinking', rating:'🔴', reason:'Thinking mode supports multi-system design with interdependencies — no need for a full frontier model. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.', fallback:{ tool:'M365 Copilot Word (Think Deeper)', vendor:'m365', reason:'Think Deeper supports complex multi-system design with interdependencies — use for documents requiring structured reasoning. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.' } },
        gemini: { tool:'Gemini 2.5 Thinking', rating:'🔴', reason:'Extended thinking supports multi-system design with interdependencies. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.' },
      },
    },
  },
  image_analyze: {
    simple: {
      rating:'🟠', tool:'Claude Haiku 4.5 (vision)', vendor:'claude',
      reason:'Small vision-capable model handles clear image Q&A and object classification without a heavyweight multimodal pipeline.',
      fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode routes simple image Q&A to the appropriate GPT-5.5 tier — vision is built into the family.' },
      vendorAlts:{
        chatgpt:{ tool:'ChatGPT Auto (vision)', rating:'🟠', reason:'GPT-5.5 supports image uploads natively — Auto routes simple image Q&A and object identification to the most efficient tier.', fallback:{ tool:'Claude Haiku 4.5 (vision)', vendor:'claude', reason:'Lightweight vision model for simple image Q&A.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Native multimodal capability handles simple image Q&A and object identification — lightweight with no separate vision pipeline needed.' },
      },
      lastValidated:'2026-05-27',
    },
    moderate: {
      rating:'🟠', tool:'Claude Sonnet 4.6 (vision)', vendor:'claude',
      reason:'Mid-tier multimodal model for structured image analysis, chart reading, and detailed descriptions.',
      fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode handles document and chart analysis; vision capability is standard across the GPT-5.5 family.' },
      vendorAlts:{
        chatgpt:{ tool:'ChatGPT Auto (vision)', rating:'🟠', reason:'GPT-5.5 handles chart reading, document analysis, and structured image descriptions — vision is built into the Auto tier.', fallback:{ tool:'Claude Sonnet 4.6 (vision)', vendor:'claude', reason:'Mid-tier multimodal model for structured analysis.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Covers structured image analysis, chart reading, and detailed descriptions — vision is built in with no separate pipeline.' },
      },
      lastValidated:'2026-05-27',
    },
    complex: {
      rating:'🟠', tool:'Claude Sonnet 4.6 (vision)', vendor:'claude',
      reason:'Even complex tasks — multi-image comparison, dense diagram reading — stay within Sonnet\'s range; no frontier model needed.',
      fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode manages complex visual inputs; upgrade to GPT-5.5 Thinking only if analytical reasoning over the image is required.' },
      vendorAlts:{
        chatgpt:{ tool:'ChatGPT Auto (vision)', rating:'🟠', reason:'Auto handles multi-image comparison and dense diagram reading; escalate to GPT-5.5 Thinking only if reasoning over the image content is required.', fallback:{ tool:'Claude Sonnet 4.6 (vision)', vendor:'claude', reason:'Handles complex visual tasks without a frontier model.' } },
        gemini: { tool:'Gemini 2.5 Thinking', rating:'🔴', reason:'Extended thinking over images handles multi-image comparison and dense diagram analysis — escalate to Thinking only when reasoning over visual content is required.' },
      },
      lastValidated:'2026-05-27',
    },
  },
  img_gen_chat: {
    // nonai = GR-12 Yes path: user has existing images
    nonai: {
      rating:'🟢', tool:'Personal or client-provided photos', vendor:null,
      reason:'Use owned or licensed images — zero AI generation cost and full control over the output.',
      lastValidated:'2026-05-01',
    },
    // simple/moderate/complex = GR-12 No path: no existing image; explicit energy cost below
    simple: {
      rating:'🔴', tool:'DALL-E 3 (standard quality)', vendor:'chatgpt',
      reason:'AI image generation carries significant compute cost — equivalent to running dozens of text requests. Standard quality reduces the overhead; use only when no existing image meets the need.',
      fallback:{ tool:'Gemini Flash (Image)', vendor:null, reason:'Faster, lighter image generation for low-stakes visuals.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🔴', tool:'DALL-E 3 (standard quality)', vendor:'chatgpt',
      reason:'AI image generation is energy-intensive. Standard quality avoids the HD compute spike — use only for content that truly requires custom imagery and cannot be sourced from existing assets.',
      fallback:{ tool:'Gemini Pro (Image)', vendor:null, reason:'Higher fidelity when standard falls short for client-facing work.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟣', tool:'DALL-E 3 (HD)', vendor:'chatgpt',
      reason:'HD image generation has very high compute cost and should be reserved only for production-bound, high-detail visuals with no stock alternative. Minimise iteration with precise prompts from the start.',
      fallback:{ tool:'Gemini Pro (Image)', vendor:null, reason:'Alternative for high-detail generation with broader style control.' },
      lastValidated:'2026-05-01',
    },
  },
  img_gen_slides: {
    // nonai = GR-12 Yes path: user has existing images/photos for slides
    nonai: {
      rating:'🟢', tool:'Stock image library', vendor:null,
      reason:'Insert your own or licensed images into slides — zero AI generation cost. PowerPoint Designer arranges them automatically with no AI overhead.',
      lastValidated:'2026-05-01',
    },
    // simple/moderate/complex = GR-12 No path: no existing assets; explicit energy cost below
    simple: {
      rating:'🟢', tool:'PowerPoint Designer (non-AI layouts)', vendor:null,
      reason:'Built-in SmartArt and design templates handle simple slide visuals with zero AI generation cost.',
      fallback:{ tool:'M365 Copilot PowerPoint (Auto)', vendor:'m365', reason:'If AI generation is needed, Auto selects the most efficient eligible model.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🔴', tool:'M365 Copilot PowerPoint (Auto)', vendor:'m365',
      reason:'AI image generation in presentations carries significant compute cost. If no stock imagery is available, Auto selects the most efficient eligible model — avoid manually selecting premium models.',
      fallback:{ tool:'Google Slides (Gemini Flash)', vendor:null, reason:'Lightweight generation integrated directly into the presentation tool.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟣', tool:'M365 Copilot PowerPoint (Auto)', vendor:'m365',
      reason:'Complex AI visual generation for slides has high energy overhead. Auto routes to the most capable eligible model — specify quality requirements in the prompt rather than selecting a model manually. Use only when no stock alternative exists.',
      fallback:{ tool:'Google Slides (Gemini Pro Image)', vendor:null, reason:'Higher fidelity alternative for complex visual compositions.' },
      lastValidated:'2026-05-01',
    },
  },
  img_edit: {
    // nonai = GR-12 Yes path: user can edit the existing image with native tools
    nonai: {
      rating:'🟢', tool:'Built-in image editing (Photos / Snip & Sketch / Preview)', vendor:null,
      reason:'Crop, resize, rotate, and colour-correct with native OS tools — zero AI energy cost for straightforward edits.',
      lastValidated:'2026-05-01',
    },
    // simple/moderate/complex = GR-12 No path: native tools insufficient; explicit energy cost below
    simple: {
      rating:'🟣', tool:'DALL-E 3 (inpainting, standard quality)', vendor:'chatgpt',
      reason:'AI image editing carries high compute cost even for simple adjustments. Inpainting at standard quality keeps overhead as low as possible — write a precise prompt to minimise retries.',
      fallback:{ tool:'Gemini Flash (Image)', vendor:null, reason:'Lighter alternative for low-stakes, non-critical image edits.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟣', tool:'DALL-E 3 (inpainting, standard quality)', vendor:'chatgpt',
      reason:'AI inpainting is energy-intensive — each failed pass is a full generation. Standard quality reduces overhead; write a precise prompt before starting to minimise iteration count.',
      fallback:{ tool:'Gemini Pro (Image)', vendor:null, reason:'Higher fidelity for structured content replacement and complex inpainting.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟣', tool:'DALL-E 3 (HD)', vendor:'chatgpt',
      reason:'Complex AI image editing at high quality carries significant compute cost. HD tier provides the fidelity needed for detailed transforms — minimise iterations with a precise prompt before starting.',
      fallback:{ tool:'Gemini Pro (Image)', vendor:null, reason:'Handles complex transformations requiring compositional understanding.' },
      lastValidated:'2026-05-01',
    },
  },
  transcribe: {
    simple: {
      rating:'🟢', tool:'Platform-embedded transcription (Teams / Zoom / Meet)', vendor:null,
      reason:'Purpose-built transcription pipeline with no LLM overhead — far more efficient than uploading audio to a chatbot.',
      fallback:{ tool:'Microsoft Teams Premium (auto-transcription)', vendor:null, reason:'Teams Premium provides enhanced accuracy and speaker labels without a separate service.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟢', tool:'Platform-embedded transcription (Teams / Zoom / Meet)', vendor:null,
      reason:'Embedded tools handle speaker diarisation and basic formatting natively — no additional model call needed.',
      fallback:{ tool:'Microsoft Teams Premium (enhanced transcription)', vendor:null, reason:'Enhanced tier improves accuracy for accented speech without an external service.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟢', tool:'Platform-embedded transcription (Teams / Zoom / Meet)', vendor:null,
      reason:'For multi-speaker or technical content, use your platform\'s built-in transcription with manual review and correction — avoids routing audio to an out-of-scope standalone service.',
      fallback:{ tool:'Microsoft Teams Premium + manual review', vendor:null, reason:'Enhanced diarisation and speaker labels within the Teams ecosystem — no external service needed.' },
      lastValidated:'2026-05-01',
    },
  },
  vid_caption: {
    simple: {
      rating:'🟢', tool:'Platform-embedded captioning (Teams / Zoom)', vendor:null,
      reason:'Auto-captioning runs inside your meeting tool — no additional model call or file upload required.',
      fallback:{ tool:'Zoom or Meet closed captions', vendor:null, reason:'Platform-native captioning runs inside the tool — no external model or file upload required.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟢', tool:'Microsoft Stream (auto-transcription)', vendor:null,
      reason:'Handles recorded content natively — no external upload or separate service required.',
      fallback:{ tool:'Microsoft Stream enhanced transcription', vendor:null, reason:'Handles recorded content natively with improved accuracy — no external service required.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟢', tool:'Microsoft Stream (auto-transcription) + manual review', vendor:null,
      reason:'Platform-native transcription for multi-speaker or multilingual content — manual review keeps errors from the final output without routing to an out-of-scope service.',
      fallback:{ tool:'Teams Premium transcription + manual review', vendor:null, reason:'Enhanced diarisation within the Microsoft ecosystem for long-form or complex video.' },
      lastValidated:'2026-05-01',
    },
  },
  vid_gen: {
    // nonai = GR-12 Yes path: user has existing footage → zero AI cost
    nonai: {
      rating:'🟢', tool:'Screen recording', vendor:null,
      reason:'Use existing recordings or licensed stock footage — zero AI generation cost. For most enterprise needs, this achieves equivalent results without any AI overhead.',
      lastValidated:'2026-05-01',
    },
    // simple/moderate/complex = GR-12 No path: no existing media, explicit energy cost stated
    simple: {
      rating:'🟢', tool:'Slide animation (PowerPoint / Keynote)', vendor:null,
      reason:'AI video generation carries among the highest compute costs of any enterprise AI task — a short clip consumes 10–50× the energy of a text request. Slide-based animations achieve comparable results for most internal and training content at zero AI cost.',
      fallback:{ tool:'Screen recording with voiceover', vendor:null, reason:'Record a narrated walkthrough — no AI generation cost, immediate output, fully controllable.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟢', tool:'Professional video production', vendor:null,
      reason:'AI video generation at this scale consumes extreme compute resources — among the highest of any enterprise AI task. No approved AI video tool is in the current shortlist. Professional production delivers better quality control and is typically more cost-effective than iterative AI generation.',
      fallback:{ tool:'Stock footage + motion graphics', vendor:null, reason:'Combine licensed stock footage with motion graphics tools — zero AI cost and immediate output for training and marketing content.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟢', tool:'Professional video production', vendor:null,
      reason:'Complex AI video generation has extreme energy overhead and no approved AI video tool exists in the current shortlist. Professional human production provides full creative control without the environmental and cost trade-offs of iterative AI generation.',
      fallback:{ tool:'Stock footage + motion graphics', vendor:null, reason:'If budget or timeline limits professional production, combine licensed stock footage with motion graphics tools — zero AI cost, immediate output.' },
      lastValidated:'2026-05-01',
    },
  },
  code_explain: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 4.5', vendor:'claude',
      reason:'Code explanation is read-only text generation — the smallest capable model handles snippet and function-level Q&A well.',
      fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode routes simple code Q&A to GPT-5.5 Instant automatically.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🟢', reason:'GPT-5.3-Codex is the LTS base model — routine code Q&A and snippet explanation are well within its range.', fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto routes simple code Q&A to the appropriate GPT-5.5 tier.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Code explanation is read-only — Gemini 2.5 Flash handles snippet and function-level Q&A at minimal overhead.' },
      },
      lastValidated:'2026-05-27',
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 4.6', vendor:'claude',
      reason:'Handles architecture explanation and multi-file review without a reasoning model.',
      fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode is sufficient for architecture explanation and multi-file code review.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🟡', reason:'Handles architecture explanation and multi-file review at the LTS baseline — no reasoning model needed.', fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode handles architecture explanation and multi-file code review.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Handles architecture explanation and multi-file review without a reasoning model.' },
      },
      lastValidated:'2026-05-27',
    },
    complex: {
      rating:'🟡', tool:'Claude Sonnet 4.6', vendor:'claude',
      reason:'Even complex architecture review is read-only — no reasoning model needed; Sonnet covers large-context code analysis effectively.',
      fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode handles large-context code review; switch to GPT-5.5 Thinking if reasoning over the architecture is needed.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🟡', reason:'Even complex architecture review is read-only — GPT-5.3-Codex covers large-context code analysis at the LTS baseline.', fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode handles large-context code review; escalate to GPT-5.5 Thinking only if reasoning over the architecture is required.' } },
        gemini: { tool:'Gemini 2.1 Pro', rating:'🔴', reason:'Handles large-context code analysis and complex architecture review — read-only tasks stay within its efficient range.' },
      },
      lastValidated:'2026-05-27',
    },
  },
  code_write: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 4.5', vendor:'claude',
      reason:'Single-function generation and simple bug fixes are within a small model\'s range — inline completion has the lowest context overhead.',
      fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode routes single-function code tasks to GPT-5.5 Instant.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🟢', reason:'Single-function generation and simple fixes are within the LTS base model\'s range — inline completion at the lowest available overhead.', fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode routes single-function code tasks to GPT-5.5 Instant.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Single-function generation and simple bug fixes are within Gemini 2.5 Flash\'s range — low context overhead for inline tasks.' },
      },
      lastValidated:'2026-05-27',
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 4.6', vendor:'claude',
      reason:'Handles multi-function code, refactoring, and moderate debugging — keep context scoped to relevant files only.',
      fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode handles multi-function code and refactoring; avoid enabling reasoning mode for standard tasks.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🟡', reason:'Handles multi-function code and refactoring at the LTS baseline — keep context scoped to relevant files.', fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode handles multi-function code and refactoring; avoid enabling reasoning mode for standard tasks.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Handles multi-function code and moderate refactoring — keep context scoped to relevant files.' },
      },
      lastValidated:'2026-05-27',
    },
    complex: {
      rating:'🟠', tool:'Claude Sonnet 4.6', vendor:'claude',
      reason:'Extended thinking resolves complex cross-system bugs — cheaper and more targeted than defaulting to Opus for difficult tasks. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.',
      fallback:{ tool:'GPT-5.5 Thinking', vendor:'chatgpt', reason:'Thinking mode provides targeted reasoning for complex multi-step debugging — lower cost than Pro Reasoning mode. Reasoning models consume significantly more energy per query than standard models — activate only when task complexity justifies it.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🟠', reason:'Complex cross-system debugging at the LTS baseline — scope context carefully and escalate to extended reasoning only when simpler passes fail.', fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode handles complex debugging; escalate to GPT-5.5 Thinking only when cross-system reasoning is required.' } },
        gemini: { tool:'Gemini 2.1 Pro', rating:'🔴', reason:'Optimized for complex code and cross-system debugging. Reasoning models consume significantly more energy per query — activate only when task complexity justifies it.' },
      },
      lastValidated:'2026-05-27',
    },
  },
  code_build: {
    simple: {
      rating:'🟠', tool:'Claude Code (Haiku model)', vendor:'claudecode',
      reason:'Interactive building with the smallest capable model — review each output step to prevent wasted context accumulation.',
      fallback:{ tool:'Cursor (Auto)', vendor:'cursor', reason:'Auto selects the most efficient Cursor-native model; keep auto-accept off and scope context to relevant files only.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🟠', reason:'Interactive building with the LTS base Codex model — review each output step to prevent context accumulation.', fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode routes interactive build tasks to the appropriate model tier.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Interactive building with a lightweight model — review each output step to prevent wasted context accumulation.' },
      },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟠', tool:'Claude Code (Sonnet model)', vendor:'claudecode',
      reason:'Standard interactive build sessions — use /clear between unrelated tasks to reset accumulated context.',
      fallback:{ tool:'Cursor (Composer 1.5)', vendor:'cursor', reason:'Composer 1.5 is Cursor\'s cost-efficient native model for standard interactive builds — keep auto-accept off.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🟠', reason:'Standard interactive build sessions at the LTS baseline — scope context to relevant files and review outputs before advancing.', fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode handles standard interactive build sessions.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Standard interactive build sessions — scope context to relevant files and clear between unrelated tasks.' },
      },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟠', tool:'Claude Code (Sonnet model)', vendor:'claudecode',
      reason:'Complex builds stay within Sonnet\'s range when you review each step — Opus is rarely justified for interactive work.',
      fallback:{ tool:'Cursor (Composer 2)', vendor:'cursor', reason:'Composer 2 handles complex multi-file builds; review each step to prevent context accumulation.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🟠', reason:'Complex interactive builds stay within the LTS model\'s range when scoped carefully — review each step to prevent wasted context.', fallback:{ tool:'ChatGPT Auto', vendor:'chatgpt', reason:'Auto mode handles complex interactive builds; avoid enabling reasoning mode for incremental work.' } },
        gemini: { tool:'Gemini 2.1 Pro', rating:'🔴', reason:'Complex interactive builds stay efficient when you scope context carefully and review each step.' },
      },
      lastValidated:'2026-05-01',
    },
  },
  code_automate: {
    simple: {
      rating:'🔴', tool:'Claude Code (Haiku, agent mode)', vendor:'claudecode',
      reason:'Simple automations — file transforms, single-API integrations — are well within Haiku\'s capability range. Agentic workflows accumulate inference cost multiplicatively — each tool call or iteration is a separate model request. Limit parallel agents and batch related tasks to reduce total query count.',
      fallback:{ tool:'GitHub Copilot (Auto)', vendor:'githubcopilot', reason:'Auto mode routes simple agentic tasks to the most efficient eligible model — no manual model selection needed.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🔴', reason:'Simple automations — file transforms, single-API integrations — are within GPT-5.3-Codex\'s range. Agentic workflows accumulate inference cost multiplicatively — each tool call or iteration is a separate model request. Limit parallel agents and batch related tasks to reduce total query count.', fallback:{ tool:'GitHub Copilot (Auto)', vendor:'githubcopilot', reason:'Auto routes simple agentic tasks to the most efficient eligible model.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Simple automations — file transforms, single-API integrations — are within Gemini 2.5 Flash\'s capability. Agentic workflows accumulate inference cost multiplicatively — batch related tasks and limit parallel agents.' },
      },
      lastValidated:'2026-05-27',
    },
    moderate: {
      rating:'🔴', tool:'Claude Code (Sonnet, agent mode)', vendor:'claudecode',
      reason:'Standard automation — use /clear between workflows and run tasks sequentially rather than with parallel agents. Agentic workflows accumulate inference cost multiplicatively — each tool call or iteration is a separate model request. Limit parallel agents and batch related tasks to reduce total query count.',
      fallback:{ tool:'Cursor (Claude Sonnet 4.5)', vendor:'cursor', reason:'Sonnet 4.5 handles writing and documentation automation within Cursor — set iteration limits and batch related tasks into one session.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🔴', reason:'Standard automation at the LTS baseline — run tasks sequentially and use /clear between workflows. Agentic workflows accumulate inference cost multiplicatively — each tool call or iteration is a separate model request. Limit parallel agents and batch related tasks to reduce total query count.', fallback:{ tool:'GitHub Copilot (Auto)', vendor:'githubcopilot', reason:'Auto mode handles moderate agentic workflows; keeps model routing efficient.' } },
        gemini: { tool:'Gemini 2.5 Flash', rating:'🟢', reason:'Standard automations handled efficiently — run tasks sequentially and clear context between workflows. Agentic workflows accumulate inference cost multiplicatively — limit parallel agents and batch related tasks.' },
      },
      lastValidated:'2026-05-27',
    },
    complex: {
      rating:'🔴', tool:'Claude Code (Sonnet, agent mode)', vendor:'claudecode',
      reason:'Even complex orchestration stays within Sonnet — Opus adds cost without proportional benefit for most agentic workflows. Agentic workflows accumulate inference cost multiplicatively — each tool call or iteration is a separate model request. Limit parallel agents and batch related tasks to reduce total query count.',
      fallback:{ tool:'Cursor (GPT-5.2 Codex)', vendor:'cursor', reason:'GPT-5.2 Codex is an efficient third-party option for complex multi-file agentic workflows; avoid parallel agents unless tasks are genuinely independent.' },
      vendorAlts:{
        codex:{ tool:'GPT-5.3-Codex', rating:'🔴', reason:'Complex orchestration at the LTS baseline — sequence related tasks and avoid parallel agents. Agentic workflows accumulate inference cost multiplicatively — each tool call or iteration is a separate model request. Limit parallel agents and batch related tasks to reduce total query count.', fallback:{ tool:'GitHub Copilot (Auto)', vendor:'githubcopilot', reason:'Auto handles complex multi-file agentic workflows; avoid parallel agents unless tasks are genuinely independent.' } },
        gemini: { tool:'Gemini 2.1 Pro', rating:'🔴', reason:'Complex orchestration with Gemini 2.1 Pro — sequence related tasks and avoid parallel agents. Agentic workflows accumulate inference cost multiplicatively — limit parallel agents and batch related tasks.' },
      },
      lastValidated:'2026-05-27',
    },
  },
};
