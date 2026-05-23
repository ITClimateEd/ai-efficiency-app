#!/usr/bin/env node
'use strict';

/**
 * registry-watch.js — Weekly model change detector
 *
 * Fetches vendor documentation pages, extracts model identifiers, diffs against
 * model-snapshot.json, and opens a GitHub issue if changes are detected.
 *
 * Runs inside a GitHub Action — see .github/workflows/registry-watch.yml.
 *
 * This script NEVER modifies registry.js. All registry changes require human
 * review against the ground rules before merging.
 */

const fs   = require('fs');
const path = require('path');

let cheerio;
try {
  cheerio = require('cheerio');
} catch {
  console.error('[watch] cheerio not found — run: npm install cheerio');
  process.exit(1);
}

const GITHUB_TOKEN   = process.env.GITHUB_TOKEN;
const REPO           = process.env.REPO;           // e.g. "owner/repo"
const SNAPSHOT_PATH  = path.join(process.cwd(), 'model-snapshot.json');
const FETCH_TIMEOUT_MS = 30_000;

// ── HTTP fetch ────────────────────────────────────────────────────────────────

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':      'Mozilla/5.0 (compatible; AI-Efficiency-Registry-Watch/1.0; +https://github.com/pascaljoly/ai-efficiency-app)',
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
  return res.text();
}

// ── Parsers ───────────────────────────────────────────────────────────────────
// Each parser returns:
//   string[] — extracted model identifiers (may be empty)
//   null      — parser not yet implemented; vendor is skipped entirely

function extractModels(vendor, html) {
  switch (vendor) {
    case 'anthropic':      return parseAnthropic(html);
    case 'openai':         return parseOpenAI(html);
    case 'github_copilot': return null; // TODO: implement — page uses a structured table
    case 'm365':           return null; // TODO: implement — release notes page, less structured
    case 'cursor':         return null; // TODO: implement — changelog page
    case 'google':         return null; // TODO: implement — model listing page
    default:
      console.warn(`[watch] no parser for vendor "${vendor}" — skipping`);
      return null;
  }
}

// Extract model names by applying a regex to each matched element individually.
// Per-element extraction prevents false positives from adjacent elements being
// concatenated (e.g. "claude-opus-4-7" + "anthropic" → "claude-opus-4-7anthropic").
function matchFromElements($, selector, pattern) {
  const results = new Set();
  $(selector).each((_, el) => {
    const text = $(el).text();
    (text.match(pattern) || []).forEach(m => results.add(m));
  });
  return [...results].sort();
}

function parseAnthropic(html) {
  const $ = cheerio.load(html);
  // Prefer <code> elements — they reliably contain isolated API model IDs on Anthropic docs.
  // Also scan table cells as a fallback (model comparison tables).
  const pattern = /claude-(?:opus|sonnet|haiku|instant)-?[a-z0-9]+(?:-[a-z0-9]+)*/g;
  const models  = [
    ...matchFromElements($, 'code',   pattern),
    ...matchFromElements($, 'td, th', pattern),
  ];
  return [...new Set(models)].filter(m => m.length >= 10).sort();
}

function parseOpenAI(html) {
  const $ = cheerio.load(html);
  // Release notes page uses headings and paragraphs — less structured than the models API page.
  const gpt     = matchFromElements($, 'code, td, li, p', /gpt-[a-z0-9]+(?:[.-][a-z0-9]+)*/g);
  const oSeries = matchFromElements($, 'code, td, li, p', /\bo[0-9][a-z0-9-]*/g)
                    .filter(m => /^o[0-9]/.test(m));
  const dalle   = matchFromElements($, 'code, td, li, p', /dall-e-[0-9]+/g);
  return [...new Set([...gpt, ...oSeries, ...dalle])].sort();
}

// ── Diff ──────────────────────────────────────────────────────────────────────

function diff(oldList, newList) {
  const oldSet = new Set(oldList);
  const newSet = new Set(newList);
  return {
    added:   [...newSet].filter(m => !oldSet.has(m)),
    removed: [...oldSet].filter(m => !newSet.has(m)),
  };
}

// ── GitHub API ────────────────────────────────────────────────────────────────

async function ghApi(method, endpoint, body) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${endpoint}`, {
    method,
    headers: {
      'Authorization':        `Bearer ${GITHUB_TOKEN}`,
      'Accept':               'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type':         'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`GitHub API ${method} ${endpoint} → ${res.status}: ${txt}`);
  }
  return res.json().catch(() => null);
}

async function ensureLabel() {
  try {
    await ghApi('POST', '/labels', {
      name:        'registry-update',
      color:       'e4b400',
      description: 'Registry change detected by automated watch action',
    });
  } catch (e) {
    if (!e.message.includes('422')) console.warn('[watch] label creation:', e.message);
    // 422 = label already exists — expected after first run
  }
}

const VENDOR_TITLES = {
  anthropic:      'Anthropic',
  openai:         'OpenAI (ChatGPT)',
  github_copilot: 'GitHub Copilot',
  m365:           'M365 Copilot',
  cursor:         'Cursor',
  google:         'Google Gemini',
};

function buildIssueBody(changes, date) {
  const sections = changes.map(({ vendor, config, added, removed }) => {
    const lines = [`### ${VENDOR_TITLES[vendor] || vendor}`];
    lines.push(`Source: ${config.source}`, '');
    if (added.length)   lines.push(`**Added:** ${added.join(', ')}`);
    if (removed.length) lines.push(`**Removed:** ${removed.join(', ')}`);
    return lines.join('\n');
  });

  return `## Registry Watch — Changes Detected (${date})

${sections.join('\n\n')}

### Ground rules to check
- **GR-02:** Is this model in the validated registry? → Review needed
- **GR-09:** Is there a lighter model that meets the same task requirements? → TBD
- **GR-04:** Should this replace an existing entry or be added alongside it? → TBD

### Recommended action
Review each vendor's documentation page and determine whether any entries in \`registry.js\` need updating. If changes are made:
1. Update the affected entries in \`registry.js\`
2. Update \`lastValidated\` on every reviewed entry
3. Bump \`REGISTRY_VERSION\` and \`REGISTRY_LAST_UPDATED\` in \`registry.js\`
4. Add a section to \`CHANGELOG.md\`
5. Close this issue with a reference to the commit

_Auto-generated by [Registry Watch](../../actions/workflows/registry-watch.yml). This action never modifies \`registry.js\` — all changes require human review._`;
}

async function openIssue(changes, date) {
  await ensureLabel();
  await ghApi('POST', '/issues', {
    title:  `Registry watch: model changes detected — ${date}`,
    body:   buildIssueBody(changes, date),
    labels: ['registry-update'],
  });
  console.log('[watch] GitHub issue opened');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const today    = new Date().toISOString().slice(0, 10);
  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const changes  = [];
  const updatedVendors = {};

  for (const [vendor, config] of Object.entries(snapshot.vendors)) {
    console.log(`[watch] checking ${VENDOR_TITLES[vendor] || vendor} …`);

    let html;
    try {
      html = await fetchHtml(config.source);
    } catch (err) {
      console.error(`[watch] ${vendor}: fetch failed — ${err.message}`);
      updatedVendors[vendor] = config; // leave unchanged
      continue;
    }

    const extracted = extractModels(vendor, html);

    if (extracted === null) {
      console.log(`[watch] ${vendor}: parser not yet implemented — skipped`);
      updatedVendors[vendor] = config; // leave unchanged
      continue;
    }

    if (extracted.length === 0) {
      // Returning an empty array likely means the page structure changed and the parser broke.
      // Skip the diff to avoid false "all models removed" noise.
      console.warn(`[watch] ${vendor}: 0 models extracted — possible parser/page-structure failure; skipping diff`);
      updatedVendors[vendor] = config;
      continue;
    }

    const { added, removed } = diff(config.models, extracted);
    console.log(`[watch] ${vendor}: ${extracted.length} models found  +${added.length} -${removed.length}`);

    if (added.length || removed.length) {
      changes.push({ vendor, config, added, removed });
      updatedVendors[vendor] = { ...config, models: extracted, last_changed: today };
    } else {
      updatedVendors[vendor] = { ...config, models: extracted };
    }
  }

  // Always write updated snapshot (refreshes last_checked and any newly extracted model lists)
  const updated = { last_checked: today, vendors: updatedVendors };
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(updated, null, 2) + '\n');
  console.log(`[watch] snapshot written (last_checked: ${today})`);

  if (changes.length > 0) {
    if (!GITHUB_TOKEN || !REPO) {
      console.warn('[watch] GITHUB_TOKEN / REPO not set — cannot open issue (dry-run output below)');
      console.log(buildIssueBody(changes, today));
    } else {
      await openIssue(changes, today);
    }
  } else {
    console.log('[watch] no changes detected — done');
  }
}

main().catch(err => {
  console.error('[watch] fatal error:', err);
  process.exit(1);
});
