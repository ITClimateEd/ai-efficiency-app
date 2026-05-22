// registry.js — AI Model Efficiency Guide recommendation data
// Maintained independently of UI logic. All recommendation lookups reference this file.

const vendorLabels = {
  chatgpt: 'ChatGPT', claude: 'Claude', codex: 'Codex',
  claudecode: 'Claude Code', cursor: 'Cursor',
  m365: 'M365 Copilot', githubcopilot: 'GitHub Copilot',
};

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

// GitHub Copilot proxy model shortlist — efficiency-first order.
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

// M365 Copilot Excel and PowerPoint model list.
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
const recommendations = {
  write: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 3.5',
      reason:'Lightweight model purpose-built for short, clear text — no reasoning overhead needed for emails, summaries, or label generation.',
      fallback:{ tool:'M365 Copilot Word (Auto)', reason:'Auto selects the most efficient Word mode for short drafts, emails, and summaries — no model configuration needed.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 3.5',
      reason:'Mid-tier model handles multi-step drafts and tone adjustment without reaching for a reasoning model.',
      fallback:{ tool:'M365 Copilot Word (Quick Response)', reason:'Quick Response handles multi-step drafts and tone adjustments with minimal processing overhead.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟡', tool:'Claude Sonnet 3.7',
      reason:'Extended thinking activates only for nuanced judgment — avoids the energy cost of a full frontier reasoning model.',
      fallback:{ tool:'M365 Copilot Word (Think Deeper)', reason:'Think Deeper applies extended reasoning for complex drafts requiring nuanced judgment — no manual model selection.' },
      lastValidated:'2026-05-01',
    },
  },
  analyze: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 3.5',
      reason:'Factual lookups and single-source summaries are well within a small model\'s capability — no reasoning loop needed.',
      fallback:{ tool:'M365 Copilot Word (Auto)', reason:'Auto mode handles factual lookups and single-source summaries efficiently within Word.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 3.5',
      reason:'Handles multi-source synthesis and structured comparison without triggering a reasoning loop.',
      fallback:{ tool:'M365 Copilot Word (Quick Response)', reason:'Quick Response covers multi-source synthesis and structured comparison within Word.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟠', tool:'Claude Sonnet 3.7 (Extended Thinking)',
      reason:'Reasoning activates on demand for deep synthesis — more efficient than routing a standard query to a frontier model by default.',
      fallback:{ tool:'M365 Copilot Word (Think Deeper)', reason:'Think Deeper applies extended reasoning for deep synthesis — no manual model selection required.' },
      lastValidated:'2026-05-01',
    },
  },
  design: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 3.5',
      reason:'Spec writing and design briefs are structured text tasks — a small model handles them without overprovisioning.',
      fallback:{ tool:'M365 Copilot Word (Auto)', reason:'Auto mode handles simple specs and design briefs within Word.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 3.5',
      reason:'Handles iterative design documents and system specs efficiently — mid-tier is well matched for this output type.',
      fallback:{ tool:'M365 Copilot Word (Quick Response)', reason:'Quick Response handles iterative design documents and system specs efficiently.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟡', tool:'Claude Sonnet 3.7',
      reason:'Extended thinking supports multi-system design with interdependencies — no need for a frontier model.',
      fallback:{ tool:'M365 Copilot Word (Think Deeper)', reason:'Think Deeper supports complex multi-system design with interdependencies — use for documents requiring structured reasoning.' },
      lastValidated:'2026-05-01',
    },
  },
  image_analyze: {
    simple: {
      rating:'🟠', tool:'Claude Haiku 3.5 (vision)',
      reason:'Small vision-capable model handles clear image Q&A and object classification without a heavyweight multimodal pipeline.',
      fallback:{ tool:'ChatGPT Auto', reason:'Auto mode routes simple image Q&A to the appropriate GPT-5.5 tier — vision is built into the family.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟠', tool:'Claude Sonnet 3.5 (vision)',
      reason:'Mid-tier multimodal model for structured image analysis, chart reading, and detailed descriptions.',
      fallback:{ tool:'ChatGPT Auto', reason:'Auto mode handles document and chart analysis; vision capability is standard across the GPT-5.5 family.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟠', tool:'Claude Sonnet 3.5 (vision)',
      reason:'Even complex tasks — multi-image comparison, dense diagram reading — stay within Sonnet\'s range; no frontier model needed.',
      fallback:{ tool:'ChatGPT Auto', reason:'Auto mode manages complex visual inputs; upgrade to GPT-5.5 Thinking only if analytical reasoning over the image is required.' },
      lastValidated:'2026-05-01',
    },
  },
  img_gen_chat: {
    simple: {
      rating:'🔴', tool:'DALL-E 3 (standard quality)',
      reason:'Standard quality avoids the compute spike from HD mode — sufficient for internal mockups and non-printed visuals.',
      fallback:{ tool:'Gemini Flash (Image)', reason:'Faster, lighter image generation for low-stakes visuals.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🔴', tool:'DALL-E 3 (standard quality)',
      reason:'Standard quality covers most enterprise image needs — only upgrade to HD if output is for print or large-format display.',
      fallback:{ tool:'Gemini Pro (Image)', reason:'Higher fidelity when standard falls short for client-facing work.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🔴', tool:'DALL-E 3 (HD)',
      reason:'HD mode is justified only for production-bound, high-detail visuals — minimise iteration with precise prompts from the start.',
      fallback:{ tool:'Gemini Pro (Image)', reason:'Alternative for high-detail generation with broader style control.' },
      lastValidated:'2026-05-01',
    },
  },
  img_gen_slides: {
    simple: {
      rating:'🔴', tool:'PowerPoint Designer (non-AI layouts)',
      reason:'Built-in SmartArt and design templates handle simple slide visuals with zero AI generation cost.',
      fallback:{ tool:'M365 Copilot PowerPoint (Auto)', reason:'If AI generation is needed, Auto selects the most efficient eligible model.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🔴', tool:'M365 Copilot PowerPoint (Auto)',
      reason:'Auto picks the most efficient eligible model for slide image generation — avoid manually selecting premium models.',
      fallback:{ tool:'Google Slides (Gemini Flash)', reason:'Lightweight generation integrated directly into the presentation tool.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟣', tool:'M365 Copilot PowerPoint (Auto)',
      reason:'Auto routes complex visual tasks to the most capable eligible model — specify quality requirements in the Copilot prompt rather than selecting a model manually.',
      fallback:{ tool:'Google Slides (Gemini Pro Image)', reason:'Higher fidelity alternative for complex visual compositions.' },
      lastValidated:'2026-05-01',
    },
  },
  img_edit: {
    simple: {
      rating:'🟣', tool:'Microsoft AI Image 2 Efficient',
      reason:'Lighter editing model handles crop, recolour, and simple transforms without triggering a full image regeneration.',
      fallback:{ tool:'Gemini Flash (Image edit)', reason:'Fast edits for non-critical, simple modifications.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟣', tool:'DALL-E 3 (inpainting, standard quality)',
      reason:'One-pass inpainting with a specific prompt reduces iteration — each retry is a full generation, so precision matters.',
      fallback:{ tool:'Gemini Pro (Image edit)', reason:'Good quality for structured content replacement and inpainting.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟣', tool:'DALL-E 3 (outpainting / multi-pass)',
      reason:'Complex transforms require multiple passes — start with the most precise prompt possible to minimise iterations.',
      fallback:{ tool:'Gemini Pro (Image edit)', reason:'Handles transformations requiring compositional understanding.' },
      lastValidated:'2026-05-01',
    },
  },
  transcribe: {
    simple: {
      rating:'🟢', tool:'Platform-embedded transcription (Teams / Zoom / Meet)',
      reason:'Purpose-built transcription pipeline with no LLM overhead — far more efficient than uploading audio to a chatbot.',
      fallback:{ tool:'Whisper (small)', reason:'Lightest standalone model when no platform tool is available.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟢', tool:'Platform-embedded transcription (Teams / Zoom / Meet)',
      reason:'Embedded tools handle speaker diarisation and basic formatting natively — no additional model call needed.',
      fallback:{ tool:'Whisper (medium)', reason:'Better accuracy for accented speech or noisy environments.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟢', tool:'Whisper (large-v3)',
      reason:'Most accurate open-source transcription for multi-speaker, technical, or domain-specific audio content.',
      fallback:{ tool:'AssemblyAI (Nano tier)', reason:'Cloud transcription with speaker labels — efficient tier for long recordings.' },
      lastValidated:'2026-05-01',
    },
  },
  vid_caption: {
    simple: {
      rating:'🟡', tool:'Platform-embedded captioning (Teams / Zoom)',
      reason:'Auto-captioning runs inside your meeting tool — no additional model call or file upload required.',
      fallback:{ tool:'Whisper (small) + subtitle tool', reason:'Lightweight transcription for short recordings outside the platform.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟡', tool:'Microsoft Stream (auto-transcription)',
      reason:'Handles recorded content natively — no external upload or separate service required.',
      fallback:{ tool:'Whisper (medium)', reason:'Higher accuracy for complex audio in recorded video.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟡', tool:'Whisper (large-v3) + manual review',
      reason:'Most accurate for multi-speaker, technical, or multilingual content — manual review keeps errors from the final output.',
      fallback:{ tool:'AssemblyAI (Nano)', reason:'Speaker labels and timestamped captions for long-form video.' },
      lastValidated:'2026-05-01',
    },
  },
  vid_gen: {
    simple: {
      rating:'🟣', tool:'Screen recording or stock footage',
      reason:'Even short AI-generated clips carry heavy compute costs — a screen recording or stock asset achieves the same result with zero AI energy.',
      fallback:{ tool:'Veo 3.1 (minimum duration and resolution)', reason:'If AI generation is unavoidable, use the shortest clip and lowest resolution that meets the need.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟣', tool:'Veo 3.1 (standard)',
      reason:'Currently the primary enterprise option — reserve for final production assets only, never for drafts or internal-use content.',
      fallback:{ tool:'Stock footage + motion graphics', reason:'Often achieves comparable results for presentations and training content at far lower cost.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟣', tool:'Veo 3.1 (standard)',
      reason:'No lighter alternative exists for complex AI video — minimise clip length, reuse generated assets, and involve a video specialist to reduce iteration count.',
      fallback:{ tool:'Professional video production', reason:'For high-stakes content, human-produced video is more controllable and often more cost-effective than iterative AI generation.' },
      lastValidated:'2026-05-01',
    },
  },
  code_explain: {
    simple: {
      rating:'🟡', tool:'Claude Haiku 3.5',
      reason:'Code explanation is read-only text generation — the smallest capable model handles snippet and function-level Q&A well.',
      fallback:{ tool:'ChatGPT Auto', reason:'Auto mode routes simple code Q&A to GPT-5.5 Instant automatically.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 3.5',
      reason:'Handles architecture explanation and multi-file review without a reasoning model.',
      fallback:{ tool:'ChatGPT Auto', reason:'Auto mode is sufficient for architecture explanation and multi-file code review.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟡', tool:'Claude Sonnet 3.5',
      reason:'Even complex architecture review is read-only — no reasoning model needed; Sonnet covers large-context code analysis effectively.',
      fallback:{ tool:'ChatGPT Auto', reason:'Auto mode handles large-context code review; switch to GPT-5.5 Thinking if reasoning over the architecture is needed.' },
      lastValidated:'2026-05-01',
    },
  },
  code_write: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 3.5',
      reason:'Single-function generation and simple bug fixes are within a small model\'s range — inline completion has the lowest context overhead.',
      fallback:{ tool:'ChatGPT Auto', reason:'Auto mode routes single-function code tasks to GPT-5.5 Instant.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟠', tool:'Claude Sonnet 3.5',
      reason:'Handles multi-function code, refactoring, and moderate debugging — keep context scoped to relevant files only.',
      fallback:{ tool:'ChatGPT Auto', reason:'Auto mode handles multi-function code and refactoring; avoid enabling reasoning mode for standard tasks.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟠', tool:'Claude Sonnet 3.7',
      reason:'Extended thinking resolves complex cross-system bugs — cheaper and more targeted than defaulting to Opus for difficult tasks.',
      fallback:{ tool:'GPT-5.5 Thinking', reason:'Thinking mode provides targeted reasoning for complex multi-step debugging — lower cost than Pro Reasoning mode.' },
      lastValidated:'2026-05-01',
    },
  },
  code_build: {
    simple: {
      rating:'🟠', tool:'Claude Code (Haiku model)',
      reason:'Interactive building with the smallest capable model — review each output step to prevent wasted context accumulation.',
      fallback:{ tool:'Cursor (Auto)', reason:'Auto selects the most efficient Cursor-native model; keep auto-accept off and scope context to relevant files only.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟠', tool:'Claude Code (Sonnet model)',
      reason:'Standard interactive build sessions — use /clear between unrelated tasks to reset accumulated context.',
      fallback:{ tool:'Cursor (Composer 1.5)', reason:'Composer 1.5 is Cursor\'s cost-efficient native model for standard interactive builds — keep auto-accept off.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟠', tool:'Claude Code (Sonnet model)',
      reason:'Complex builds stay within Sonnet\'s range when you review each step — Opus is rarely justified for interactive work.',
      fallback:{ tool:'Cursor (Composer 2)', reason:'Composer 2 handles complex multi-file builds; review each step to prevent context accumulation.' },
      lastValidated:'2026-05-01',
    },
  },
  code_automate: {
    simple: {
      rating:'🔴', tool:'Claude Code (Haiku, agent mode)',
      reason:'Simple automations — file transforms, single-API integrations — are well within Haiku\'s capability range.',
      fallback:{ tool:'GitHub Copilot (Auto)', reason:'Auto mode routes simple agentic tasks to the most efficient eligible model — no manual model selection needed.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🔴', tool:'Claude Code (Sonnet, agent mode)',
      reason:'Standard automation — use /clear between workflows and run tasks sequentially rather than with parallel agents.',
      fallback:{ tool:'Cursor (Claude Sonnet 4.5)', reason:'Sonnet 4.5 handles writing and documentation automation within Cursor — set iteration limits and batch related tasks into one session.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🔴', tool:'Claude Code (Sonnet, agent mode)',
      reason:'Even complex orchestration stays within Sonnet — Opus adds cost without proportional benefit for most agentic workflows.',
      fallback:{ tool:'Cursor (GPT-5.2 Codex)', reason:'GPT-5.2 Codex is an efficient third-party option for complex multi-file agentic workflows; avoid parallel agents unless tasks are genuinely independent.' },
      lastValidated:'2026-05-01',
    },
  },
};
