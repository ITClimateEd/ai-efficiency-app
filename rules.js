// rules.js — Ground rule enforcement (GR-01 through GR-12)

// GR-01/GR-03: resolve which selected vendor best matches the recommended model.
// Code-only vendors are never matched for non-code tasks (sourced from registry.js codeOnlyVendors).
function resolveToolFromVendors(modelStr, vendors, taskId) {
  const s = modelStr.toLowerCase();
  const isCode = taskId && taskId.startsWith('code_');
  const patterns = {
    chatgpt:       () => /gpt|dall-e/.test(s),
    claude:        () => /^claude/i.test(s),
    codex:         () => /codex/.test(s),
    claudecode:    () => /claude code/.test(s),
    cursor:        () => /cursor/.test(s) || /claude (haiku|sonnet|opus)/.test(s),
    m365:          () => /m365|microsoft|copilot|powerpoint|excel|stream/.test(s),
    githubcopilot: () => /github copilot/.test(s),
  };
  const codePriority    = ['cursor','claudecode','claude','chatgpt','githubcopilot','codex','m365'];
  const nonCodePriority = ['claude','claudecode','cursor','chatgpt','m365','githubcopilot','codex'];
  const order = isCode ? codePriority : nonCodePriority;
  return order.find(v => {
    if (!isCode && CODE_ONLY_VENDORS.has(v)) return false;
    return vendors.has(v) && patterns[v] && patterns[v]();
  }) || null;
}

// GR-01/GR-02/GR-06: resolve the registry node for the given task and complexity.
// When vendor filter is active and the primary vendor isn't selected, check vendorAlts for a match.
// Code-only vendors are excluded from the alt lookup for non-code tasks.
function resolveNode(taskId, complexity) {
  let node = recommendations[taskId] && recommendations[taskId][complexity];
  if (!node) return null;
  if (state.vendors.size > 0 && node.vendor && !state.vendors.has(node.vendor) && node.vendorAlts) {
    const isCode = taskId && taskId.startsWith('code_');
    const ALT_ORDER = isCode
      ? ['chatgpt','m365','claudecode','cursor','githubcopilot','codex']
      : ['chatgpt','m365'];
    const altVendor = ALT_ORDER.find(v => state.vendors.has(v) && node.vendorAlts[v]);
    if (altVendor) {
      node = Object.assign({ lastValidated: node.lastValidated }, node.vendorAlts[altVendor], { vendor: altVendor });
    }
  }
  return node;
}

// GR-01/GR-03: returns true when the fallback recommendation passes the active vendor filter.
function isFallbackInScope(node, vendors) {
  return !node.fallback.vendor || vendors.size === 0 || vendors.has(node.fallback.vendor);
}
