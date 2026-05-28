// decision-tree.js — State management, input handlers, and hash routing

const state = {
  vendor: null,
  modality: null,
  task: null,
  complexity: null,
  hasMedia: null,
  noai: { q1: null, q2: null, q3: null },
};

// Known-good value whitelists for hash param sanitisation
const KNOWN_VENDORS     = new Set(['chatgpt','claude','gemini','codex','claudecode','cursor','m365','githubcopilot']);
const KNOWN_MODALITIES  = new Set(['text','image','audio','video','code','noai']);
const KNOWN_COMPLEXITIES= new Set(['simple','moderate','complex']);
const KNOWN_ANSWERS     = new Set(['yes','no']);
let   KNOWN_TASKS       = new Set();
function safeParam(val, whitelist) { return whitelist.has(val) ? val : null; }
// GR-12: tasks that require the media-availability gate before model selection
const MEDIA_GATE_TASKS = new Set(['img_gen_chat','img_gen_slides','img_edit','vid_gen']);
// GR-11: proxy tools route through a vendor-managed model picker; default display is "Auto"
const PROXY_VENDORS = new Set(['cursor','m365','githubcopilot']);
function isProxyNativeTool(toolStr) {
  // Returns true when the registry string already encodes the chosen proxy mode/model
  return /cursor\s*\(|copilot\s*\(|m365\s*\(|composer|think deeper|quick response|powerpoint|excel|stream|github\s+copilot\s*\(/i.test(toolStr);
}

// Populate task whitelist from the tasks object (tasks defined in registry.js)
Object.values(tasks).forEach(arr => arr.forEach(t => KNOWN_TASKS.add(t.id)));

// ── Tool picker (step 3) ─────────────────────────────────────────
function pickTool(vendor, el) {
  state.vendor = vendor;
  state.complexity = null;
  document.querySelectorAll('#step-tool .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('result-area').innerHTML = '';
  document.getElementById('cta-block').style.display = 'none';
  renderComplexityStep();
  encodeHash();
}

// ── Step 1: modality ─────────────────────────────────────────────
function pick(type, value, el) {
  if (type === 'modality') {
    state.modality = value;
    state.vendor = null;
    state.task = null;
    state.complexity = null;
    state.hasMedia = null;
    state.noai = { q1: null, q2: null, q3: null };
    document.querySelectorAll('#step1 .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('result-area').innerHTML = '';
    document.getElementById('cta-block').style.display = 'none';
    document.getElementById('step-media-gate').style.display = 'none';
    document.getElementById('div-media-gate').style.display = 'none';
    document.getElementById('step-tool').style.display = 'none';
    document.getElementById('div-tool').style.display = 'none';
    document.getElementById('div2').style.display = 'none';
    document.getElementById('step-complexity').style.display = 'none';
    document.getElementById('div3').style.display = 'none';
    document.querySelectorAll('[data-noai]').forEach(c => c.classList.remove('active'));
    document.getElementById('noai-q2').style.display = 'none';
    document.getElementById('noai-q3').style.display = 'none';
    if (value === 'noai') {
      document.getElementById('step2').style.display = 'none';
      document.getElementById('noai-flow').style.display = '';
      document.getElementById('div1').style.display = '';
    } else {
      document.getElementById('noai-flow').style.display = 'none';
      renderTaskStep();
    }
    encodeHash();
  } else {
    // Task selection
    state.task = value;
    state.vendor = null;
    state.complexity = null;
    state.hasMedia = null;
    document.querySelectorAll('#step2 .chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('result-area').innerHTML = '';
    document.getElementById('cta-block').style.display = 'none';
    document.getElementById('div3').style.display = 'none';
    document.getElementById('step-tool').style.display = 'none';
    document.getElementById('div-tool').style.display = 'none';
    document.getElementById('div2').style.display = 'none';
    document.getElementById('step-complexity').style.display = 'none';
    if (MEDIA_GATE_TASKS.has(value)) {
      document.querySelectorAll('[data-media-gate]').forEach(c => c.classList.remove('active'));
      document.getElementById('div-media-gate').style.display = '';
      document.getElementById('step-media-gate').style.display = '';
    } else {
      document.getElementById('div-media-gate').style.display = 'none';
      document.getElementById('step-media-gate').style.display = 'none';
      renderToolStep();
    }
    encodeHash();
  }
}

// ── Step 4: complexity ───────────────────────────────────────────
function pickComplexity(complexity, el) {
  state.complexity = complexity;
  document.querySelectorAll('#step-complexity .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderResult();
  encodeHash();
}

// ── GR-12: media gate ────────────────────────────────────────────
function pickMediaGate(answer, el) {
  state.hasMedia = answer;
  document.querySelectorAll('[data-media-gate]').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  if (answer === 'yes') {
    document.getElementById('step-tool').style.display = 'none';
    document.getElementById('div-tool').style.display = 'none';
    document.getElementById('div2').style.display = 'none';
    document.getElementById('step-complexity').style.display = 'none';
    document.getElementById('div3').style.display = '';
    renderMediaResult();
  } else {
    renderToolStep();
  }
  encodeHash();
}

// ── No-AI screening ──────────────────────────────────────────────
function answerNoAi(question, answer, el) {
  state.noai[question] = answer;
  document.querySelectorAll('[data-noai^="' + question + '"]').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  if (question === 'q1') {
    if (answer === 'yes') {
      renderNoAiResult();
    } else {
      document.getElementById('noai-q2').style.display = '';
    }
  } else if (question === 'q2') {
    if (answer === 'yes') {
      renderNoAiRoute();
    } else {
      document.getElementById('noai-q3').style.display = '';
    }
  } else {
    if (answer === 'yes') {
      renderNoAiResult();
    } else {
      renderNoAiRoute();
    }
  }
  encodeHash();
}

function routeToMain() {
  state.modality = null;
  state.noai = { q1: null, q2: null, q3: null };
  document.querySelectorAll('#step1 .chip').forEach(c => c.classList.remove('active'));
  document.getElementById('noai-flow').style.display = 'none';
  document.getElementById('div1').style.display = 'none';
  document.getElementById('div2').style.display = 'none';
  document.getElementById('result-area').innerHTML = '';
  document.getElementById('cta-block').style.display = 'none';
  encodeHash();
}

// ── Hash routing ─────────────────────────────────────────────────
function encodeHash() {
  const p = {};
  if (state.vendor) p.vendor = state.vendor;
  if (state.modality) p.modality = state.modality;
  if (state.task) p.task = state.task;
  if (state.hasMedia && MEDIA_GATE_TASKS.has(state.task)) p.hasMedia = state.hasMedia;
  if (state.complexity) p.complexity = state.complexity;
  if (state.modality === 'noai') {
    if (state.noai.q1) p.q1 = state.noai.q1;
    if (state.noai.q2) p.q2 = state.noai.q2;
    if (state.noai.q3) p.q3 = state.noai.q3;
  }
  const str = Object.entries(p).map(([k,v]) => k + '=' + encodeURIComponent(v)).join('&');
  history.replaceState(null, '', str ? '#' + str : window.location.pathname + window.location.search);
}

function decodeHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  let p;
  try {
    p = Object.fromEntries(
      hash.split('&').filter(s => s.includes('=')).map(s => {
        const i = s.indexOf('=');
        return [s.slice(0, i), decodeURIComponent(s.slice(i + 1))];
      })
    );
  } catch(e) { return; }

  const modality = safeParam(p.modality, KNOWN_MODALITIES);
  if (!modality) return;
  state.modality = modality;
  const mc = document.querySelector('[data-modality="' + modality + '"]');
  if (mc) mc.classList.add('active');
  document.getElementById('div1').style.display = '';

  if (modality === 'noai') {
    document.getElementById('noai-flow').style.display = '';
    const q1 = safeParam(p.q1, KNOWN_ANSWERS);
    if (q1) {
      state.noai.q1 = q1;
      const c = document.querySelector('[data-noai="q1-' + q1 + '"]');
      if (c) c.classList.add('active');
      if (q1 === 'yes') { renderNoAiResult(); return; }
      document.getElementById('noai-q2').style.display = '';
    }
    const q2 = safeParam(p.q2, KNOWN_ANSWERS);
    if (q2) {
      state.noai.q2 = q2;
      const c = document.querySelector('[data-noai="q2-' + q2 + '"]');
      if (c) c.classList.add('active');
      if (q2 === 'yes') { renderNoAiRoute(); return; }
      document.getElementById('noai-q3').style.display = '';
    }
    const q3 = safeParam(p.q3, KNOWN_ANSWERS);
    if (q3) {
      state.noai.q3 = q3;
      const c = document.querySelector('[data-noai="q3-' + q3 + '"]');
      if (c) c.classList.add('active');
      renderNoAiResult();
    }
    return;
  }

  const task = safeParam(p.task, KNOWN_TASKS);
  if (!task) return;
  state.task = task;
  renderTaskStep();
  const tc = document.querySelector('[data-task="' + task + '"]');
  if (tc) tc.classList.add('active');

  if (MEDIA_GATE_TASKS.has(task)) {
    document.getElementById('div-media-gate').style.display = '';
    document.getElementById('step-media-gate').style.display = '';
    const hasMedia = safeParam(p.hasMedia, KNOWN_ANSWERS);
    if (hasMedia) {
      state.hasMedia = hasMedia;
      const mgEl = document.querySelector('[data-media-gate="' + hasMedia + '"]');
      if (mgEl) mgEl.classList.add('active');
      if (hasMedia === 'yes') { renderMediaResult(); return; }
      renderToolStep();
    } else { return; }
  } else {
    renderToolStep();
  }

  // Restore vendor — only if the task has vendor options
  const availableVendors = getAvailableVendors(task);
  const vendor = safeParam(p.vendor, KNOWN_VENDORS);
  if (availableVendors.length === 0) {
    // Null-vendor task: renderToolStep already called renderComplexityStep
  } else if (vendor && availableVendors.includes(vendor)) {
    state.vendor = vendor;
    const vc = document.querySelector('[data-tool="' + vendor + '"]');
    if (vc) vc.classList.add('active');
    renderComplexityStep();
  } else {
    return; // tool step visible but no valid vendor
  }

  const complexity = safeParam(p.complexity, KNOWN_COMPLEXITIES);
  if (!complexity) return;
  state.complexity = complexity;
  const cc = document.querySelector('[data-complexity="' + complexity + '"]');
  if (cc) cc.classList.add('active');
  renderResult();
}

// ── Reset ────────────────────────────────────────────────────────
function resetAll() {
  state.vendor = null;
  state.modality = null;
  state.task = null;
  state.complexity = null;
  state.hasMedia = null;
  state.noai = { q1: null, q2: null, q3: null };
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.getElementById('noai-flow').style.display = 'none';
  document.getElementById('noai-q2').style.display = 'none';
  document.getElementById('noai-q3').style.display = 'none';
  document.getElementById('step-media-gate').style.display = 'none';
  document.getElementById('div-media-gate').style.display = 'none';
  document.getElementById('step2').style.display = 'none';
  document.getElementById('step-tool').style.display = 'none';
  document.getElementById('div-tool').style.display = 'none';
  document.getElementById('step-complexity').style.display = 'none';
  document.getElementById('div1').style.display = 'none';
  document.getElementById('div2').style.display = 'none';
  document.getElementById('div3').style.display = 'none';
  document.getElementById('result-area').innerHTML = '';
  document.getElementById('cta-block').style.display = 'none';
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

window.addEventListener('load', decodeHash);
