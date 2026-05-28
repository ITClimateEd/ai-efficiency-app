// rules.js — Ground rule enforcement (GR-01 through GR-12)

const RATING_ORDER = { '🟢': 1, '🟡': 2, '🟠': 3, '🔴': 4, '🟣': 5 };

// GR-01/GR-03: single vendor lookup — returns the tool name for this vendor+task (any complexity), or null.
function resolveToolFromVendor(vendor, task) {
  const taskRecs = recommendations[task];
  if (!taskRecs || !vendor) return null;
  const complexities = ['simple', 'moderate', 'complex'];
  for (const c of complexities) {
    const node = taskRecs[c];
    if (!node) continue;
    if (node.vendor === vendor) return node.tool;
    if (node.vendorAlts && node.vendorAlts[vendor]) return node.vendorAlts[vendor].tool;
  }
  return null;
}

// Returns array of vendor keys that have entries for a given task (across all complexities).
// Excludes null-vendor entries (platform-agnostic recommendations).
function getAvailableVendors(task) {
  const taskRecs = recommendations[task];
  if (!taskRecs) return [];
  const vendorSet = new Set();
  const complexities = ['simple', 'moderate', 'complex'];
  for (const c of complexities) {
    const node = taskRecs[c];
    if (!node) continue;
    if (node.vendor) vendorSet.add(node.vendor);
    if (node.vendorAlts) Object.keys(node.vendorAlts).forEach(v => vendorSet.add(v));
  }
  return [...vendorSet];
}

// GR-04: returns true when the selected vendor's rating matches the best available for task+complexity.
function isGreenestOption(vendor, task, complexity) {
  const taskRecs = recommendations[task];
  if (!taskRecs || !taskRecs[complexity] || !vendor) return true;
  const primary = taskRecs[complexity];

  let currentRating;
  if (vendor === primary.vendor) {
    currentRating = primary.rating;
  } else if (primary.vendorAlts && primary.vendorAlts[vendor]) {
    currentRating = primary.vendorAlts[vendor].rating;
  } else {
    return true;
  }
  const currentOrder = RATING_ORDER[currentRating] || 99;

  let bestOrder = primary.rating ? (RATING_ORDER[primary.rating] || 99) : 99;
  if (primary.vendorAlts) {
    Object.values(primary.vendorAlts).forEach(alt => {
      const order = RATING_ORDER[alt.rating] || 99;
      if (order < bestOrder) bestOrder = order;
    });
  }

  return currentOrder <= bestOrder;
}

// Returns the best alternative option for a given vendor+task+complexity, or null if vendor is greenest.
// Used to populate the "Greener alternative" section in the result card.
function getGreenestAlternative(vendor, task, complexity) {
  const taskRecs = recommendations[task];
  if (!taskRecs || !taskRecs[complexity]) return null;
  const primary = taskRecs[complexity];

  const candidates = [];
  if (primary.vendor && primary.vendor !== vendor) {
    candidates.push({ vendor: primary.vendor, tool: primary.tool, rating: primary.rating, reason: primary.reason });
  }
  if (primary.vendorAlts) {
    Object.entries(primary.vendorAlts).forEach(([v, alt]) => {
      if (v !== vendor) {
        candidates.push({ vendor: v, tool: alt.tool, rating: alt.rating, reason: alt.reason });
      }
    });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => (RATING_ORDER[a.rating] || 99) - (RATING_ORDER[b.rating] || 99));
  return candidates[0];
}

// GR-01/GR-02/GR-06: resolve the registry node for the given task and complexity.
// When a vendor is selected and differs from the primary, returns the matching vendorAlt entry.
function resolveNode(taskId, complexity) {
  const entry = recommendations[taskId] && recommendations[taskId][complexity];
  if (!entry) return null;
  if (state.vendor && state.vendor !== entry.vendor && entry.vendorAlts && entry.vendorAlts[state.vendor]) {
    return Object.assign({ lastValidated: entry.lastValidated }, entry.vendorAlts[state.vendor], { vendor: state.vendor });
  }
  return entry;
}
