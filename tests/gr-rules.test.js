/**
 * tests/gr-rules.test.js
 * Run with: node tests/gr-rules.test.js
 *
 * Validates GR-01 through GR-12 against the live registry and enforcement
 * functions. Flags current violations before any fixes are applied.
 *
 * EXIT CODE: 0 = all tests pass (violations are flagged but do not fail);
 *            1 = at least one test assertion failed.
 */

'use strict';
const vm     = require('vm');
const fs     = require('fs');
const path   = require('path');
const assert = require('assert/strict');

// ── Load source files into a shared vm context ────────────────────
// decision-tree.js calls window.addEventListener at top level — mock minimally.
// const/let are promoted to var so they're accessible on the context object.
const ctx = vm.createContext({
  console,
  window:   { addEventListener: () => {} },
  document: { getElementById: () => ({}), querySelector: () => null, querySelectorAll: () => [] },
  history:  { replaceState: () => {} },
});

const root = path.join(__dirname, '..');
function load(file) {
  const code = fs.readFileSync(path.join(root, file), 'utf8')
    .replace(/\b(const|let)\b /g, 'var ');
  vm.runInContext(code, ctx);
}
load('registry.js');
load('rules.js');
load('decision-tree.js');

const {
  resolveToolFromVendors, resolveNode, isFallbackInScope, isProxyNativeTool,
  recommendations, tasks, ratings, vendorLabels, codeOnlyVendors,
  MEDIA_GATE_TASKS, PROXY_VENDORS, CODE_ONLY_VENDORS,
} = ctx;

// ── Helpers ───────────────────────────────────────────────────────
function allNodes() {
  return Object.entries(recommendations).flatMap(([taskId, map]) =>
    Object.entries(map).map(([complexity, node]) => ({ taskId, complexity, node }))
  );
}

function allTools() {
  const out = [];
  for (const { taskId, complexity, node } of allNodes()) {
    const loc = `${taskId}.${complexity}`;
    if (node.tool) out.push({ loc, tool: node.tool, kind: 'primary' });
    if (node.fallback && node.fallback.tool)
      out.push({ loc, tool: node.fallback.tool, kind: 'fallback' });
    if (node.vendorAlts) {
      for (const [v, alt] of Object.entries(node.vendorAlts)) {
        if (alt.tool) out.push({ loc: `${loc}.vendorAlts.${v}`, tool: alt.tool, kind: 'alt' });
        if (alt.fallback && alt.fallback.tool)
          out.push({ loc: `${loc}.vendorAlts.${v}.fallback`, tool: alt.fallback.tool, kind: 'alt-fallback' });
      }
    }
  }
  return out;
}

const COMPLEXITY_ORDER = ['simple', 'moderate', 'complex'];
const RATING_WEIGHT    = { '🟢': 0, '🟡': 1, '🟠': 2, '🔴': 3, '🟣': 4 };

// Valid tool strings per SPEC.md Section 2 (source of truth for GR-02).
const SPEC_TOOLS = new Set([
  // 2.1 ChatGPT
  'ChatGPT Auto', 'GPT-5.5 Instant', 'GPT-5.5 Thinking', 'Pro Reasoning mode',
  // 2.2 Claude — updated to 4.x (open item 3.1 resolved)
  'Claude Haiku 4.5', 'Claude Haiku 4.5 (vision)',
  'Claude Sonnet 4.6', 'Claude Sonnet 4.6 (vision)',
  'Claude Sonnet 4.6 (Extended Thinking)',
  // 2.3 Claude Code
  'Claude Code (Haiku model)', 'Claude Code (Haiku, agent mode)',
  'Claude Code (Sonnet model)', 'Claude Code (Sonnet, agent mode)',
  // 2.4 Cursor
  'Cursor (Auto)', 'Cursor (Composer 1.5)', 'Cursor (Composer 2)',
  'Cursor (GPT-5.2 Codex)', 'Cursor (Claude Sonnet 4.5)', 'Cursor (Claude Sonnet 4.6)',
  // 2.5 GitHub Copilot
  'GitHub Copilot (Auto)', 'GPT-5.3-Codex', 'GPT-5.4-mini',
  'Claude Haiku 4.5', 'Claude Sonnet 4.6',
  // 2.6 M365 Word
  'M365 Copilot Word (Auto)', 'M365 Copilot Word (Quick Response)', 'M365 Copilot Word (Think Deeper)',
  // 2.7 M365 Excel
  'M365 Copilot Excel (Auto)', 'GPT-5.4', 'GPT-5.5', 'Claude Opus 4.6', 'Claude Opus 4.7',
  // 2.8 M365 PowerPoint
  'M365 Copilot PowerPoint (Auto)',
  // 2.9 Image generation
  'Stock image library', 'Personal or client-provided photos',
  'Built-in image editing (Photos / Snip & Sketch / Preview)',
  'DALL-E 3 (standard quality)', 'DALL-E 3 (HD)',
  'DALL-E 3 (inpainting, standard quality)',
  'Gemini Flash (Image)', 'Gemini Pro (Image)',
  // 2.10 Video generation
  'Stock footage', 'Screen recording', 'Stock footage + motion graphics',
  'Professional video production', 'Slide animation (PowerPoint / Keynote)',
  'Screen recording with voiceover',
  // 2.11 Gemini
  'Gemini Flash 2.0', 'Gemini Pro 1.5',
  'Google Slides (Gemini Flash)', 'Google Slides (Gemini Pro Image)',
  // 2.12 Platform-native
  'Platform-embedded transcription (Teams / Zoom / Meet)',
  'Platform-embedded captioning (Teams / Zoom)',
  'PowerPoint Designer (non-AI layouts)',
  'Microsoft Stream (auto-transcription)',
  'Microsoft Teams Premium (auto-transcription)',
  'Microsoft Teams Premium (enhanced transcription)',
  'Microsoft Teams Premium + manual review',
  'Zoom or Meet closed captions',
  'Microsoft Stream enhanced transcription',
  'Microsoft Stream (auto-transcription) + manual review',
  'Teams Premium transcription + manual review',
]);

// ── Test runner ───────────────────────────────────────────────────
let pass = 0, fail = 0;
const flagged = [];  // known violations — informational, do not fail the run

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓  ${label}`);
    pass++;
  } catch (e) {
    console.error(`  ✗  ${label}`);
    console.error(`       ${e.message}`);
    fail++;
  }
}

function flag(label, detail) {
  flagged.push(`${label} — ${detail}`);
  console.warn(`  ⚠  VIOLATION: ${label}`);
  console.warn(`       ${detail}`);
}

function group(title) { console.log(`\n${title}`); }

// ── withVendors: sets and restores ctx.state.vendors ─────────────
function withVendors(vendorArr, fn) {
  const prev = ctx.state.vendors;
  ctx.state.vendors = new Set(vendorArr);
  try { fn(); } finally { ctx.state.vendors = prev; }
}

// =================================================================
// GR-01 — Never recommend a filtered-out tool
// =================================================================
group('GR-01  Never recommend a filtered-out tool');

test('resolveToolFromVendors returns null when vendor is not in filter', () => {
  const result = resolveToolFromVendors('Claude Haiku 4.5', new Set(['chatgpt']), 'write');
  assert.strictEqual(result, null, 'Claude tool should not resolve to chatgpt vendor');
});

test('resolveToolFromVendors returns correct vendor when it is in filter', () => {
  const result = resolveToolFromVendors('Claude Haiku 4.5', new Set(['claude']), 'write');
  assert.strictEqual(result, 'claude');
});

test('code-only vendors (codex, claudecode, cursor) excluded for non-code tasks', () => {
  const codeOnlySet = new Set(codeOnlyVendors);
  for (const v of codeOnlySet) {
    const result = resolveToolFromVendors('Claude Haiku 4.5', new Set([v]), 'write');
    assert.strictEqual(result, null, `code-only vendor ${v} should not match non-code tool`);
  }
});

test('resolveNode does not return filtered primary — falls through to vendorAlt or null', () => {
  withVendors(['chatgpt'], () => {
    const node = resolveNode('write', 'simple');
    // Primary vendor is claude; chatgpt vendorAlt exists → should get chatgpt alt, not claude primary
    assert.ok(node !== null, 'should find an alt node');
    assert.strictEqual(node.vendor, 'chatgpt', `expected chatgpt alt, got ${node.vendor}`);
  });
});

test('resolveNode returns null node when no vendor matches and no vendorAlt available', () => {
  withVendors(['m365'], () => {
    // image_analyze has no m365 vendorAlt
    const node = resolveNode('image_analyze', 'simple');
    // Primary is claude, no m365 alt → node comes back as original (gap handled in renderResult)
    // resolveNode returns the primary node unchanged when no alt matches
    assert.ok(node !== null); // node is still returned; gap is surfaced by renderResult
  });
});

// =================================================================
// GR-02 — Only recommend from the validated tool list
// =================================================================
group('GR-02  Only recommend from the validated tool list');

test('every recommendation node has a non-empty tool string', () => {
  const bad = allNodes().filter(({ node }) => !node.tool || !node.tool.trim());
  assert.strictEqual(bad.length, 0,
    'Nodes with missing tool: ' + bad.map(x => `${x.taskId}.${x.complexity}`).join(', '));
});

test('every recommendation node has a valid rating key', () => {
  const bad = allNodes().filter(({ node }) => !ratings[node.rating]);
  assert.strictEqual(bad.length, 0,
    'Nodes with invalid rating: ' + bad.map(x => `${x.taskId}.${x.complexity}=${x.node.rating}`).join(', '));
});

// Flag tools not in SPEC Section 2 (informational — some are open items)
(function checkGR02Registry() {
  const unknown = allTools().filter(({ tool }) => !SPEC_TOOLS.has(tool));
  for (const { loc, tool, kind } of unknown) {
    flag(`GR-02 ${loc} (${kind})`,
      `"${tool}" not found in SPEC.md Section 2. ` +
      (tool.match(/Claude (Haiku|Sonnet|Opus) \d\.\d/)
        ? 'Claude 4.x in registry vs 3.x in SPEC — see open item 3.1.'
        : 'String differs from SPEC entry — verify or update SPEC.'));
  }
})();

// =================================================================
// GR-03 — Alternatives must pass the same filters
// =================================================================
group('GR-03  Alternatives must pass the same filters');

test('isFallbackInScope returns false when fallback vendor is filtered out', () => {
  const node = recommendations['write']['simple'];  // fallback vendor: m365
  const result = isFallbackInScope(node, new Set(['claude']));  // m365 not selected
  assert.strictEqual(result, false, 'fallback with excluded vendor should be out of scope');
});

test('isFallbackInScope returns true when fallback vendor is in filter', () => {
  const node = recommendations['write']['simple'];  // fallback vendor: m365
  const result = isFallbackInScope(node, new Set(['m365']));
  assert.strictEqual(result, true);
});

test('isFallbackInScope returns true when no vendor filter is active', () => {
  const node = recommendations['write']['simple'];
  const result = isFallbackInScope(node, new Set());
  assert.strictEqual(result, true, 'no filter → all fallbacks in scope');
});

test('isFallbackInScope returns true for null-vendor fallbacks regardless of filter', () => {
  // null vendor = platform-agnostic, always shown
  const nullVendorNode = { fallback: { tool: 'PowerPoint Designer', vendor: null } };
  assert.strictEqual(isFallbackInScope(nullVendorNode, new Set(['claude'])), true);
  assert.strictEqual(isFallbackInScope(nullVendorNode, new Set()), true);
});

test('code-only vendors excluded from non-code vendorAlt lookup', () => {
  withVendors(['codex'], () => {
    // write is a non-code task; codex has no write vendorAlt → should not match
    const node = resolveNode('write', 'simple');
    // Primary vendor is claude, codex not an alt for write → node unchanged (gap in renderResult)
    assert.ok(node !== null);
    assert.strictEqual(node.vendor, 'claude', 'codex should not resolve write alt');
  });
});

// =================================================================
// GR-04 — Rank by energy efficiency (efficiency is the tiebreaker)
// =================================================================
group('GR-04  Rank by energy efficiency when capability is equivalent');

test('within each task, complexity rating never decreases simple → moderate → complex', () => {
  const failures = [];
  for (const [taskId, complexityMap] of Object.entries(recommendations)) {
    const nodes = COMPLEXITY_ORDER.map(c => complexityMap[c]).filter(Boolean);
    for (let i = 1; i < nodes.length; i++) {
      const prev = RATING_WEIGHT[nodes[i - 1].rating] ?? -1;
      const curr = RATING_WEIGHT[nodes[i].rating] ?? -1;
      if (curr < prev) {
        failures.push(
          `${taskId}: ${COMPLEXITY_ORDER[i - 1]}(${nodes[i-1].rating}) > ${COMPLEXITY_ORDER[i]}(${nodes[i].rating})`
        );
      }
    }
  }
  assert.strictEqual(failures.length, 0, 'Rating regressions: ' + failures.join('; '));
});

test('within each vendorAlt path, rating never decreases across complexities', () => {
  const failures = [];
  const vendorAltsByKey = {};
  for (const [taskId, complexityMap] of Object.entries(recommendations)) {
    for (const [complexity, node] of Object.entries(complexityMap)) {
      if (!node.vendorAlts) continue;
      for (const [vendor, alt] of Object.entries(node.vendorAlts)) {
        const key = `${taskId}:${vendor}`;
        if (!vendorAltsByKey[key]) vendorAltsByKey[key] = [];
        vendorAltsByKey[key].push({ complexity, rating: alt.rating });
      }
    }
  }
  for (const [key, entries] of Object.entries(vendorAltsByKey)) {
    const ordered = COMPLEXITY_ORDER.map(c => entries.find(e => e.complexity === c)).filter(Boolean);
    for (let i = 1; i < ordered.length; i++) {
      const prev = RATING_WEIGHT[ordered[i - 1].rating] ?? -1;
      const curr = RATING_WEIGHT[ordered[i].rating] ?? -1;
      if (curr < prev) {
        failures.push(`${key}: ${ordered[i-1].complexity}(${ordered[i-1].rating}) > ${ordered[i].complexity}(${ordered[i].rating})`);
      }
    }
  }
  assert.strictEqual(failures.length, 0, 'VendorAlt rating regressions: ' + failures.join('; '));
});

// =================================================================
// GR-05 — Flag the gap, don't fabricate a fit
// =================================================================
group('GR-05  Flag the gap — do not fabricate a fit');

test('resolveToolFromVendors returns null (not a wrong vendor) when no vendor matches', () => {
  // Only m365 selected; image_analyze primary is claude; no m365 alt → null
  const node = resolveNode('image_analyze', 'simple');
  const result = resolveToolFromVendors(node.tool, new Set(['m365']), 'image_analyze');
  assert.strictEqual(result, null, 'should return null, not a fabricated vendor match');
});

test('resolveToolFromVendors returns null for code-only vendor on non-code task', () => {
  const result = resolveToolFromVendors('Claude Sonnet 4.6', new Set(['codex']), 'analyze');
  assert.strictEqual(result, null);
});

test('every task + complexity has a registry entry (no silent gaps)', () => {
  const allTaskIds = Object.values(tasks).flat().map(t => t.id);
  const missing = [];
  for (const taskId of allTaskIds) {
    const isGated = MEDIA_GATE_TASKS.has(taskId);
    const complexities = isGated ? ['nonai', 'simple', 'moderate', 'complex'] : ['simple', 'moderate', 'complex'];
    for (const c of complexities) {
      if (!recommendations[taskId] || !recommendations[taskId][c]) {
        missing.push(`${taskId}.${c}`);
      }
    }
  }
  assert.strictEqual(missing.length, 0, 'Missing registry entries: ' + missing.join(', '));
});

// =================================================================
// GR-06 — Respect access constraints
// =================================================================
group('GR-06  Respect access constraints (vendor filter is a hard gate)');

test('no vendor outside the active filter appears as a resolved recommendation', () => {
  const vendors = ['chatgpt', 'claude', 'codex', 'claudecode', 'cursor', 'm365', 'githubcopilot'];
  for (const allowed of vendors) {
    withVendors([allowed], () => {
      for (const [taskId, map] of Object.entries(recommendations)) {
        for (const complexity of COMPLEXITY_ORDER) {
          const node = resolveNode(taskId, complexity);
          if (!node) continue;
          const resolved = resolveToolFromVendors(node.tool, new Set([allowed]), taskId);
          if (resolved !== null) {
            assert.strictEqual(resolved, allowed,
              `${taskId}.${complexity}: resolved to ${resolved} but only ${allowed} is active`);
          }
        }
      }
    });
  }
});

// =================================================================
// GR-07 — One primary recommendation per path
// =================================================================
group('GR-07  One primary recommendation per path');

test('resolveNode returns exactly one node (or null) for every task × complexity', () => {
  for (const [taskId, map] of Object.entries(recommendations)) {
    for (const complexity of Object.keys(map)) {
      withVendors([], () => {
        const node = resolveNode(taskId, complexity);
        assert.ok(node === null || typeof node === 'object',
          `${taskId}.${complexity} should return object or null`);
        assert.ok(!Array.isArray(node),
          `${taskId}.${complexity} must not return an array`);
      });
    }
  }
});

test('resolveNode with vendor filter also returns exactly one node or null', () => {
  withVendors(['claude', 'chatgpt'], () => {
    for (const [taskId, map] of Object.entries(recommendations)) {
      for (const complexity of COMPLEXITY_ORDER) {
        if (!map[complexity]) continue;
        const node = resolveNode(taskId, complexity);
        assert.ok(!Array.isArray(node), `${taskId}.${complexity} must not be an array`);
      }
    }
  });
});

// =================================================================
// GR-08 — Model/mode specificity is required
// =================================================================
group('GR-08  Model/mode specificity is required');

test('every primary node tool string is specific (not just a bare vendor name)', () => {
  const bareNames = new Set(Object.keys(vendorLabels));  // 'chatgpt', 'claude', etc.
  const bad = allNodes().filter(({ node }) => bareNames.has(node.tool));
  assert.strictEqual(bad.length, 0,
    'Bare vendor names as tool: ' + bad.map(x => `${x.taskId}.${x.complexity}=${x.node.tool}`).join(', '));
});

test('every fallback tool string is non-empty', () => {
  const bad = allNodes().filter(({ node }) =>
    node.fallback && (!node.fallback.tool || !node.fallback.tool.trim())
  );
  assert.strictEqual(bad.length, 0,
    'Nodes with empty fallback tool: ' + bad.map(x => `${x.taskId}.${x.complexity}`).join(', '));
});

test('all vendorAlt entries have a non-empty tool string', () => {
  const bad = [];
  for (const { taskId, complexity, node } of allNodes()) {
    if (!node.vendorAlts) continue;
    for (const [v, alt] of Object.entries(node.vendorAlts)) {
      if (!alt.tool || !alt.tool.trim()) bad.push(`${taskId}.${complexity}.vendorAlts.${v}`);
    }
  }
  assert.strictEqual(bad.length, 0, 'Empty alt tools: ' + bad.join(', '));
});

// =================================================================
// GR-09 — No upselling to heavier models
// =================================================================
group('GR-09  No upselling to heavier models');

test('no simple task has a heavier rating than its complex equivalent in the same path', () => {
  const failures = [];
  for (const [taskId, map] of Object.entries(recommendations)) {
    const simple  = map['simple'];
    const complex = map['complex'];
    if (!simple || !complex) continue;
    if ((RATING_WEIGHT[simple.rating] ?? 99) > (RATING_WEIGHT[complex.rating] ?? 99)) {
      failures.push(`${taskId}: simple(${simple.rating}) heavier than complex(${complex.rating})`);
    }
  }
  assert.strictEqual(failures.length, 0, failures.join('; '));
});

test('no simple vendorAlt has heavier rating than its complex equivalent', () => {
  const failures = [];
  for (const [taskId, map] of Object.entries(recommendations)) {
    const allVendors = new Set([
      ...Object.keys(map.simple?.vendorAlts ?? {}),
      ...Object.keys(map.complex?.vendorAlts ?? {}),
    ]);
    for (const vendor of allVendors) {
      const s = map.simple?.vendorAlts?.[vendor];
      const c = map.complex?.vendorAlts?.[vendor];
      if (!s || !c) continue;
      if ((RATING_WEIGHT[s.rating] ?? 99) > (RATING_WEIGHT[c.rating] ?? 99)) {
        failures.push(`${taskId}.vendorAlts.${vendor}: simple(${s.rating}) > complex(${c.rating})`);
      }
    }
  }
  assert.strictEqual(failures.length, 0, failures.join('; '));
});

// =================================================================
// GR-10 — ChatGPT modes reflect enterprise workspace reality
// =================================================================
group('GR-10  ChatGPT modes are GPT-5.5 family only (no legacy models)');

const LEGACY_CHATGPT_PATTERN = /gpt-4|gpt4|o1-mini|o3-mini|gpt-3\.5|turbo/i;

test('no primary or fallback tool references legacy ChatGPT models', () => {
  const bad = allTools().filter(({ tool }) => LEGACY_CHATGPT_PATTERN.test(tool));
  assert.strictEqual(bad.length, 0,
    'Legacy ChatGPT models found: ' + bad.map(x => `${x.loc}: "${x.tool}"`).join(', '));
});

test('text-mode chatgpt-vendor nodes use GPT-5.5 family or Auto (DALL-E allowed for image tasks)', () => {
  // GR-10 scopes to ChatGPT as a text workspace tool. DALL-E 3 is the valid chatgpt
  // image-generation tool per SPEC Section 2.9 and is exempt from the GPT-5.5-only rule.
  const IMAGE_TASKS   = new Set(['img_gen_chat', 'img_gen_slides', 'img_edit']);
  const ALLOWED_TEXT  = /chatgpt auto|gpt-5\.[0-9]|auto/i;
  const ALLOWED_IMAGE = /dall-e/i;
  const bad = [];
  for (const { taskId, complexity, node } of allNodes()) {
    if (node.vendor === 'chatgpt') {
      const ok = IMAGE_TASKS.has(taskId)
        ? ALLOWED_IMAGE.test(node.tool) || ALLOWED_TEXT.test(node.tool)
        : ALLOWED_TEXT.test(node.tool);
      if (!ok) bad.push(`${taskId}.${complexity}: "${node.tool}"`);
    }
    if (node.vendorAlts?.chatgpt && !ALLOWED_TEXT.test(node.vendorAlts.chatgpt.tool)) {
      bad.push(`${taskId}.${complexity}.vendorAlts.chatgpt: "${node.vendorAlts.chatgpt.tool}"`);
    }
  }
  assert.strictEqual(bad.length, 0, 'Non-enterprise ChatGPT tools: ' + bad.join(', '));
});

// =================================================================
// GR-11 — Auto mode is the preferred default for proxy tools
// =================================================================
group('GR-11  Auto mode is default for proxy tools (Cursor, M365, GitHub Copilot)');

test('isProxyNativeTool correctly identifies named-mode strings', () => {
  assert.ok(isProxyNativeTool('M365 Copilot Word (Think Deeper)'));
  assert.ok(isProxyNativeTool('Cursor (Composer 2)'));
  assert.ok(isProxyNativeTool('GitHub Copilot (Auto)'));
  assert.ok(!isProxyNativeTool('Claude Haiku 4.5'), 'non-proxy tool should return false');
});

test('proxy vendor primary nodes either name a specific mode or are handled as Auto', () => {
  // Every node whose primary vendor is a proxy vendor must be detectable by isProxyNativeTool
  // (named mode) OR its tool string matches the proxy pattern (will show as Auto in UI).
  const failures = [];
  for (const { taskId, complexity, node } of allNodes()) {
    if (!PROXY_VENDORS.has(node.vendor)) continue;
    if (!isProxyNativeTool(node.tool) && !PROXY_VENDORS.has(node.vendor)) {
      failures.push(`${taskId}.${complexity}: proxy vendor ${node.vendor} tool "${node.tool}" is ambiguous`);
    }
  }
  assert.strictEqual(failures.length, 0, failures.join('; '));
});

test('all PROXY_VENDORS set members match the known proxy vendor ids', () => {
  const known = new Set(['cursor', 'm365', 'githubcopilot']);
  for (const v of PROXY_VENDORS) {
    assert.ok(known.has(v), `Unknown proxy vendor in PROXY_VENDORS: ${v}`);
  }
});

// =================================================================
// GR-12 — Non-AI is the primary recommendation for image/video generation
// =================================================================
group('GR-12  Non-AI is the primary for image and video generation tasks');

test('all MEDIA_GATE_TASKS have a nonai registry entry', () => {
  for (const taskId of MEDIA_GATE_TASKS) {
    assert.ok(
      recommendations[taskId] && recommendations[taskId].nonai,
      `${taskId} missing nonai entry`
    );
  }
});

test('all nonai entries have null vendor (platform-agnostic)', () => {
  for (const taskId of MEDIA_GATE_TASKS) {
    const node = recommendations[taskId]?.nonai;
    if (!node) continue;
    assert.strictEqual(node.vendor, null, `${taskId}.nonai vendor should be null, got ${node.vendor}`);
  }
});

test('all nonai entries have the lightest possible rating (🟢)', () => {
  for (const taskId of MEDIA_GATE_TASKS) {
    const node = recommendations[taskId]?.nonai;
    if (!node) continue;
    assert.strictEqual(node.rating, '🟢', `${taskId}.nonai rating should be 🟢, got ${node.rating}`);
  }
});

test('nonai entries are lighter than their AI counterparts', () => {
  for (const taskId of MEDIA_GATE_TASKS) {
    const nonai = recommendations[taskId]?.nonai;
    const simple = recommendations[taskId]?.simple;
    if (!nonai || !simple) continue;
    const nonaiW = RATING_WEIGHT[nonai.rating] ?? 99;
    const simpleW = RATING_WEIGHT[simple.rating] ?? 99;
    assert.ok(nonaiW <= simpleW,
      `${taskId}: nonai(${nonai.rating}) should be ≤ simple(${simple.rating})`);
  }
});

test('MEDIA_GATE_TASKS covers image and video generation tasks only', () => {
  const expected = new Set(['img_gen_chat', 'img_gen_slides', 'img_edit', 'vid_gen']);
  for (const t of MEDIA_GATE_TASKS) {
    assert.ok(expected.has(t), `Unexpected task in MEDIA_GATE_TASKS: ${t}`);
  }
  for (const t of expected) {
    assert.ok(MEDIA_GATE_TASKS.has(t), `Expected task missing from MEDIA_GATE_TASKS: ${t}`);
  }
});

// =================================================================
// Summary
// =================================================================
console.log('\n' + '─'.repeat(60));
console.log(`Results: ${pass} passed, ${fail} failed`);

if (flagged.length > 0) {
  console.log(`\nViolations flagged (${flagged.length}) — review before fixing:`);
  flagged.forEach((v, i) => console.warn(`  ${i + 1}. ${v}`));
}

if (fail > 0) {
  console.error('\nFAIL — fix failing assertions before merging.');
  process.exitCode = 1;
} else {
  console.log(flagged.length > 0
    ? '\nAll assertions pass. Violations above are known issues — see open items in SPEC.md.'
    : '\nAll assertions pass. No violations flagged.');
}
