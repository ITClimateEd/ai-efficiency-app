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

const recommendations = {
  write: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 3.5',
      reason:'Lightweight model purpose-built for short, clear text — no reasoning overhead needed for emails, summaries, or label generation.',
      fallback:{ tool:'Gemini Flash 2.0', reason:'Fast and efficient for routine text tasks across Google Workspace.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 3.5',
      reason:'Mid-tier model handles multi-step drafts and tone adjustment without reaching for a reasoning model.',
      fallback:{ tool:'Gemini Pro 1.5', reason:'Strong mid-range alternative with a large context window.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟡', tool:'Claude Sonnet 3.7',
      reason:'Extended thinking activates only for nuanced judgment — avoids the energy cost of a full frontier reasoning model.',
      fallback:{ tool:'GPT-4o', reason:'Sufficient for most complex writing tasks without enabling a reasoning mode.' },
      lastValidated:'2026-05-01',
    },
  },
  analyze: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 3.5',
      reason:'Factual lookups and single-source summaries are well within a small model\'s capability — no reasoning loop needed.',
      fallback:{ tool:'Gemini Flash 2.0', reason:'Fast inference with built-in search grounding for simple research tasks.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 3.5',
      reason:'Handles multi-source synthesis and structured comparison without triggering a reasoning loop.',
      fallback:{ tool:'Gemini Pro 1.5', reason:'Large context window suits multi-document analysis.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟠', tool:'Claude Sonnet 3.7 (Extended Thinking)',
      reason:'Reasoning activates on demand for deep synthesis — more efficient than routing a standard query to a frontier model by default.',
      fallback:{ tool:'o3-mini', reason:'Reasoning-optimised at lower cost than o1/o3 for structured analytical tasks.' },
      lastValidated:'2026-05-01',
    },
  },
  design: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 3.5',
      reason:'Spec writing and design briefs are structured text tasks — a small model handles them without overprovisioning.',
      fallback:{ tool:'Gemini Flash 2.0', reason:'Fast drafting for PRDs, UX copy, and simple briefs.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 3.5',
      reason:'Handles iterative design documents and system specs efficiently — mid-tier is well matched for this output type.',
      fallback:{ tool:'GPT-4o', reason:'Strong structured reasoning for product and design documentation.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟡', tool:'Claude Sonnet 3.7',
      reason:'Extended thinking supports multi-system design with interdependencies — no need for a frontier model.',
      fallback:{ tool:'GPT-4o', reason:'Sufficient for complex design documents; reasoning mode optional.' },
      lastValidated:'2026-05-01',
    },
  },
  image_analyze: {
    simple: {
      rating:'🟠', tool:'Claude Haiku 3.5 (vision)',
      reason:'Small vision-capable model handles clear image Q&A and object classification without a heavyweight multimodal pipeline.',
      fallback:{ tool:'GPT-4o mini (vision)', reason:'Lightweight multimodal model for straightforward visual tasks.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟠', tool:'Claude Sonnet 3.5 (vision)',
      reason:'Mid-tier multimodal model for structured image analysis, chart reading, and detailed descriptions.',
      fallback:{ tool:'GPT-4o (vision)', reason:'Strong visual understanding for documents, charts, and product images.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟠', tool:'Claude Sonnet 3.5 (vision)',
      reason:'Even complex tasks — multi-image comparison, dense diagram reading — stay within Sonnet\'s range; no frontier model needed.',
      fallback:{ tool:'GPT-4o (vision)', reason:'Handles large or detailed visual inputs without a model upgrade.' },
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
      fallback:{ tool:'Copilot Auto mode (PowerPoint)', reason:'If AI generation is needed, Auto selects the lightest suitable model.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🔴', tool:'Copilot Auto mode (PowerPoint)',
      reason:'Auto model selection picks the lightest model that meets quality requirements — avoid manually selecting premium models.',
      fallback:{ tool:'Google Slides (Gemini Flash)', reason:'Lightweight generation integrated directly into the presentation tool.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟣', tool:'Copilot (GPT-Image, standard quality)',
      reason:'Higher quality for client-facing or printed assets — standard quality only; HD adds cost without proportional benefit.',
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
      fallback:{ tool:'GPT-4o mini', reason:'Lightweight option for inline code Q&A in the ChatGPT interface or API.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟡', tool:'Claude Sonnet 3.5',
      reason:'Handles architecture explanation and multi-file review without a reasoning model.',
      fallback:{ tool:'GPT-4o', reason:'Strong code comprehension for moderately complex codebases.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟡', tool:'Claude Sonnet 3.5',
      reason:'Even complex architecture review is read-only — no reasoning model needed; Sonnet covers large-context code analysis effectively.',
      fallback:{ tool:'GPT-4o', reason:'Handles large context windows for full-codebase review.' },
      lastValidated:'2026-05-01',
    },
  },
  code_write: {
    simple: {
      rating:'🟢', tool:'Claude Haiku 3.5',
      reason:'Single-function generation and simple bug fixes are within a small model\'s range — inline completion has the lowest context overhead.',
      fallback:{ tool:'GPT-4o mini', reason:'Lightweight for targeted, single-function code tasks.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟠', tool:'Claude Sonnet 3.5',
      reason:'Handles multi-function code, refactoring, and moderate debugging — keep context scoped to relevant files only.',
      fallback:{ tool:'GPT-4o', reason:'Strong write/debug performance; avoid reasoning mode for standard tasks.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟠', tool:'Claude Sonnet 3.7',
      reason:'Extended thinking resolves complex cross-system bugs — cheaper and more targeted than defaulting to Opus for difficult tasks.',
      fallback:{ tool:'o3-mini', reason:'Reasoning-capable at lower cost than o1 for complex multi-step debugging.' },
      lastValidated:'2026-05-01',
    },
  },
  code_build: {
    simple: {
      rating:'🟠', tool:'Claude Code (Haiku model)',
      reason:'Interactive building with the smallest capable model — review each output step to prevent wasted context accumulation.',
      fallback:{ tool:'Cursor (GPT-4o mini, manual mode)', reason:'Lightweight model with auto-accept off and context scoped to relevant files.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🟠', tool:'Claude Code (Sonnet model)',
      reason:'Standard interactive build sessions — use /clear between unrelated tasks to reset accumulated context.',
      fallback:{ tool:'Cursor (Sonnet, manual mode)', reason:'Set context to relevant files only; keep auto-accept off.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🟠', tool:'Claude Code (Sonnet model)',
      reason:'Complex builds stay within Sonnet\'s range when you review each step — Opus is rarely justified for interactive work.',
      fallback:{ tool:'Cursor (Sonnet, manual mode)', reason:'Extended context handles complex multi-file tasks without a model upgrade.' },
      lastValidated:'2026-05-01',
    },
  },
  code_automate: {
    simple: {
      rating:'🔴', tool:'Claude Code (Haiku, agent mode)',
      reason:'Simple automations — file transforms, single-API integrations — are well within Haiku\'s capability range.',
      fallback:{ tool:'GitHub Copilot (agent mode)', reason:'Inline agent for single-file or simple multi-step automation tasks.' },
      lastValidated:'2026-05-01',
    },
    moderate: {
      rating:'🔴', tool:'Claude Code (Sonnet, agent mode)',
      reason:'Standard automation — use /clear between workflows and run tasks sequentially rather than with parallel agents.',
      fallback:{ tool:'Cursor (Sonnet, agent mode)', reason:'Set iteration limits; batch related tasks into one session to reduce context overhead.' },
      lastValidated:'2026-05-01',
    },
    complex: {
      rating:'🔴', tool:'Claude Code (Sonnet, agent mode)',
      reason:'Even complex orchestration stays within Sonnet — Opus adds cost without proportional benefit for most agentic workflows.',
      fallback:{ tool:'Cursor (Sonnet, agent mode)', reason:'Multi-file orchestration is manageable with Sonnet; avoid parallel agents unless tasks are genuinely independent.' },
      lastValidated:'2026-05-01',
    },
  },
};
