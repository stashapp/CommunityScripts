"use strict";

/* Tag Optimizer — read-only analysis that surfaces cleanup candidates.
 *
 * Every finding carries enough context (tag ids + names, sample scene ids,
 * counts) for the UI to deep-link to Stash's native tag/scene edit page.
 * We never mutate — Stash's plugin API can't reliably edit tags without a
 * mutation permission we don't want to require. */

// Normalise a tag name so different casings / separators / punctuation
// collapse onto one form. Deliberately aggressive — we surface potential
// duplicates for a human to confirm, not silently merge.
function normalize(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

// Crude singularise. Only strips a trailing 's' when the base is ≥ 3 chars
// and doesn't already end in "ss" (kiss → kis is wrong, but tits → tit is
// fine here — the human still confirms).
function singularise(name) {
  const n = String(name || "").toLowerCase();
  if (n.length < 4) return n;
  if (n.endsWith("ies")) return n.slice(0, -3) + "y";
  if (n.endsWith("es") && !n.endsWith("ses")) return n.slice(0, -2);
  if (n.endsWith("s") && !n.endsWith("ss")) return n.slice(0, -1);
  return n;
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  // Bounded: caller already skips pairs where |lenA - lenB| > 2, so the
  // matrix stays small.
  let prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  let curr = new Array(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

// ----- 1. Near-duplicate clusters ---------------------------------
// Two tags are near-duplicates if:
//   - They share the same normalised form (case/punct/separator only), OR
//   - Their normalised forms differ by ≤ 2 characters (Levenshtein) and
//     both are ≥ 4 chars (avoid matching "cop" ↔ "cup").
function findNearDuplicates(tags, sceneCountByTagId) {
  const byNorm = new Map();
  for (const t of tags) {
    const n = normalize(t.name);
    if (!n) continue;
    if (!byNorm.has(n)) byNorm.set(n, []);
    byNorm.get(n).push(t);
  }
  const clusters = [];
  const seen = new Set();
  // Same normalised form clusters.
  for (const [n, ts] of byNorm) {
    if (ts.length < 2) continue;
    clusters.push({
      kind: "identical_normalised",
      normalised: n,
      tags: ts.map((t) => ({
        id: t.id, name: t.name, sceneCount: sceneCountByTagId.get(t.id) || 0,
      })).sort((a, b) => b.sceneCount - a.sceneCount),
    });
    for (const t of ts) seen.add(t.id);
  }
  // Levenshtein-close clusters among the remaining tags. O(n²) on tag
  // count but bounded by early-outs; for libraries with < 5000 tags this
  // is fine.
  const forms = Array.from(byNorm.entries())
    .filter(([, ts]) => ts.length === 1)
    .map(([n, ts]) => ({ n, t: ts[0] }))
    .filter((x) => x.n.length >= 4 && !seen.has(x.t.id));
  forms.sort((a, b) => a.n.localeCompare(b.n));
  for (let i = 0; i < forms.length; i++) {
    if (seen.has(forms[i].t.id)) continue;
    const group = [forms[i]];
    for (let j = i + 1; j < forms.length; j++) {
      if (seen.has(forms[j].t.id)) continue;
      // Prefix bucket — bail once first letter diverges too far.
      if (forms[j].n.charCodeAt(0) - forms[i].n.charCodeAt(0) > 1) break;
      if (Math.abs(forms[j].n.length - forms[i].n.length) > 2) continue;
      if (levenshtein(forms[i].n, forms[j].n) <= 2) group.push(forms[j]);
    }
    if (group.length >= 2) {
      clusters.push({
        kind: "levenshtein_close",
        normalised: forms[i].n,
        tags: group.map((x) => ({
          id: x.t.id, name: x.t.name, sceneCount: sceneCountByTagId.get(x.t.id) || 0,
        })).sort((a, b) => b.sceneCount - a.sceneCount),
      });
      for (const g of group) seen.add(g.t.id);
    }
  }
  // Singular/plural clusters.
  const bySingular = new Map();
  for (const t of tags) {
    if (seen.has(t.id)) continue;
    const s = singularise(normalize(t.name));
    if (!s || s.length < 3) continue;
    if (!bySingular.has(s)) bySingular.set(s, []);
    bySingular.get(s).push(t);
  }
  for (const [s, ts] of bySingular) {
    if (ts.length < 2) continue;
    clusters.push({
      kind: "singular_plural",
      normalised: s,
      tags: ts.map((t) => ({
        id: t.id, name: t.name, sceneCount: sceneCountByTagId.get(t.id) || 0,
      })).sort((a, b) => b.sceneCount - a.sceneCount),
    });
    for (const t of ts) seen.add(t.id);
  }
  return clusters.sort((a, b) => {
    const ac = a.tags.reduce((s, t) => s + t.sceneCount, 0);
    const bc = b.tags.reduce((s, t) => s + t.sceneCount, 0);
    return bc - ac;
  });
}

// ----- 2. Rare & orphan tags --------------------------------------
function findRareAndOrphanTags(tags, sceneCountByTagId, opts) {
  const rareThreshold = (opts && opts.rareThreshold) || 3;
  const rare = [];
  const orphan = [];
  for (const t of tags) {
    const c = sceneCountByTagId.get(t.id) || 0;
    if (c === 0) orphan.push({ id: t.id, name: t.name });
    else if (c < rareThreshold) rare.push({ id: t.id, name: t.name, sceneCount: c });
  }
  return {
    rare: rare.sort((a, b) => a.sceneCount - b.sceneCount || a.name.localeCompare(b.name)),
    orphan: orphan.sort((a, b) => a.name.localeCompare(b.name)),
    rareThreshold,
  };
}

// ----- 3. Always-together / redundant pairs -----------------------
// For each pair (A, B) with |A ∩ B| ≥ minSupport:
//   jaccard   = |A ∩ B| / |A ∪ B|
//   implies_A_B = |A ∩ B| / |A|    (A implies B this often)
//   implies_B_A = |A ∩ B| / |B|
// Findings:
//   jaccard ≥ 0.95  → merge candidate (both tags are effectively the same)
//   implies_A_B == 1 AND implies_B_A < 1 → A is a strict specialisation of B
//     (safe to make B a parent of A, or delete A if B carries all the info)
function findRedundantPairs(scenes, tags, opts) {
  const minSupport = (opts && opts.pairMinSupport) || 5;
  const tagById = new Map(tags.map((t) => [t.id, t]));
  const scenesByTag = new Map();
  for (const s of scenes) {
    for (const t of s.tags || []) {
      if (!scenesByTag.has(t.id)) scenesByTag.set(t.id, new Set());
      scenesByTag.get(t.id).add(s.id);
    }
  }
  // Co-occurrence — count pair intersections in one pass.
  const pairInter = new Map();
  for (const s of scenes) {
    const ids = Array.from(new Set((s.tags || []).map((t) => t.id))).sort();
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const k = ids[i] + "|" + ids[j];
        pairInter.set(k, (pairInter.get(k) || 0) + 1);
      }
    }
  }
  const merges = [];
  const specialisations = [];
  for (const [key, inter] of pairInter) {
    if (inter < minSupport) continue;
    const [aId, bId] = key.split("|");
    const aSet = scenesByTag.get(aId), bSet = scenesByTag.get(bId);
    if (!aSet || !bSet) continue;
    const union = aSet.size + bSet.size - inter;
    const jaccard = union > 0 ? inter / union : 0;
    const impAtoB = inter / aSet.size;
    const impBtoA = inter / bSet.size;
    const a = tagById.get(aId), b = tagById.get(bId);
    if (!a || !b) continue;
    const rec = {
      a: { id: aId, name: a.name, sceneCount: aSet.size },
      b: { id: bId, name: b.name, sceneCount: bSet.size },
      intersection: inter, jaccard: +jaccard.toFixed(3),
      impliesAtoB: +impAtoB.toFixed(3), impliesBtoA: +impBtoA.toFixed(3),
    };
    if (jaccard >= 0.95) merges.push(rec);
    else if (impAtoB >= 0.98 && impBtoA < 0.9 && aSet.size >= minSupport) {
      // A strictly implies B; A is the more specific one.
      specialisations.push(Object.assign({}, rec, { specific: rec.a, general: rec.b }));
    } else if (impBtoA >= 0.98 && impAtoB < 0.9 && bSet.size >= minSupport) {
      specialisations.push(Object.assign({}, rec, { specific: rec.b, general: rec.a }));
    }
  }
  return {
    merges: merges.sort((x, y) => y.intersection - x.intersection).slice(0, 30),
    specialisations: specialisations.sort((x, y) => y.intersection - x.intersection).slice(0, 30),
    minSupport,
  };
}

// ----- 4. Under/over-tagged scenes --------------------------------
function findScenesByTagCount(scenes, opts) {
  const under = (opts && opts.underTaggedMax) || 2;   // ≤ this
  const over = (opts && opts.overTaggedMin) || 20;    // ≥ this
  const underTagged = [];
  const overTagged = [];
  for (const s of scenes) {
    const c = (s.tags || []).length;
    if (c <= under) underTagged.push({
      id: s.id, title: s.title || ("Scene " + s.id),
      tagCount: c, studio: s.studio ? s.studio.name : null,
    });
    else if (c >= over) overTagged.push({
      id: s.id, title: s.title || ("Scene " + s.id),
      tagCount: c, studio: s.studio ? s.studio.name : null,
    });
  }
  underTagged.sort((a, b) => a.tagCount - b.tagCount || a.title.localeCompare(b.title));
  overTagged.sort((a, b) => b.tagCount - a.tagCount);
  return {
    under: underTagged.slice(0, 25),
    over: overTagged.slice(0, 25),
    underThreshold: under, overThreshold: over,
    underTotal: underTagged.length, overTotal: overTagged.length,
  };
}

// ----- 5. Naming inconsistency ------------------------------------
// Look at buckets of tags that only differ by case, whitespace, or
// separator. If any bucket has more than one canonical form, surface it.
function findNamingInconsistency(tags, sceneCountByTagId) {
  const buckets = new Map();
  for (const t of tags) {
    const key = normalize(t.name);
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, new Set());
    buckets.get(key).add(t.name);
  }
  const findings = [];
  for (const [key, forms] of buckets) {
    if (forms.size < 2) continue;
    const arr = Array.from(forms);
    findings.push({
      normalised: key,
      forms: arr.map((n) => {
        // Find the tag id for this form. Same-normalised bucket may hold
        // more than one tag id when Stash allowed the duplicates — keep
        // them all.
        const matches = tags.filter((t) => t.name === n);
        return matches.map((m) => ({
          id: m.id, name: m.name, sceneCount: sceneCountByTagId.get(m.id) || 0,
        }));
      }).flat(),
    });
  }
  return findings.sort((a, b) => {
    const ac = a.forms.reduce((s, f) => s + f.sceneCount, 0);
    const bc = b.forms.reduce((s, f) => s + f.sceneCount, 0);
    return bc - ac;
  });
}

// ----- 6. Hierarchy audit -----------------------------------------
// Given Stash's declared parent/child relationships, flag:
//   - "child not implying parent" — scenes on child that don't have parent
//   - "orphaned children" — child has zero scenes yet still declared
function auditHierarchy(tags, scenes) {
  const tagById = new Map(tags.map((t) => [t.id, t]));
  const sceneTagIds = scenes.map((s) => new Set((s.tags || []).map((t) => t.id)));
  const findings = [];
  for (const t of tags) {
    if (!t.children || !t.children.length) continue;
    for (const child of t.children) {
      const childFull = tagById.get(child.id);
      const childName = childFull ? childFull.name : child.name;
      let childScenes = 0, childWithoutParent = 0;
      for (const s of sceneTagIds) {
        if (!s.has(child.id)) continue;
        childScenes++;
        if (!s.has(t.id)) childWithoutParent++;
      }
      if (childScenes === 0) {
        findings.push({
          kind: "empty_child",
          parent: { id: t.id, name: t.name },
          child: { id: child.id, name: childName },
          childScenes: 0, childWithoutParent: 0,
        });
      } else if (childWithoutParent > 0) {
        findings.push({
          kind: "child_missing_parent",
          parent: { id: t.id, name: t.name },
          child: { id: child.id, name: childName },
          childScenes, childWithoutParent,
          share: +(childWithoutParent / childScenes).toFixed(3),
        });
      }
    }
  }
  return findings
    .sort((a, b) => (b.childWithoutParent || 0) - (a.childWithoutParent || 0))
    .slice(0, 50);
}

function computeTagOptimization(tags, scenes, opts) {
  opts = opts || {};
  const sceneCountByTagId = new Map();
  for (const s of scenes) {
    for (const t of s.tags || []) {
      sceneCountByTagId.set(t.id, (sceneCountByTagId.get(t.id) || 0) + 1);
    }
  }
  const nearDuplicates = findNearDuplicates(tags, sceneCountByTagId);
  const rareOrphan = findRareAndOrphanTags(tags, sceneCountByTagId, opts);
  const redundant = findRedundantPairs(scenes, tags, opts);
  const sceneTags = findScenesByTagCount(scenes, opts);
  const namingInconsistency = findNamingInconsistency(tags, sceneCountByTagId);
  const hierarchyIssues = auditHierarchy(tags, scenes);
  // A compact "cleanup score" 0-100: 100 = spotless.
  const totalTags = Math.max(1, tags.length);
  const totalScenes = Math.max(1, scenes.length);
  const dedupePenalty = Math.min(30, nearDuplicates.length * 2);
  const orphanPenalty = Math.min(20, rareOrphan.orphan.length * 0.5);
  const rarePenalty = Math.min(15, (rareOrphan.rare.length / totalTags) * 100);
  const underPenalty = Math.min(20, (sceneTags.underTotal / totalScenes) * 100);
  const inconsistencyPenalty = Math.min(15, namingInconsistency.length * 1.5);
  const cleanupScore = Math.max(0, +(100 - dedupePenalty - orphanPenalty - rarePenalty - underPenalty - inconsistencyPenalty).toFixed(1));
  return {
    cleanupScore,
    summary: {
      totalTags,
      taggedScenes: scenes.filter((s) => (s.tags || []).length > 0).length,
      nearDuplicateClusters: nearDuplicates.length,
      orphans: rareOrphan.orphan.length,
      rareTags: rareOrphan.rare.length,
      mergeCandidatePairs: redundant.merges.length,
      specialisationPairs: redundant.specialisations.length,
      undertaggedScenes: sceneTags.underTotal,
      overtaggedScenes: sceneTags.overTotal,
      inconsistentBuckets: namingInconsistency.length,
      hierarchyIssues: hierarchyIssues.length,
    },
    nearDuplicates,
    rare: rareOrphan.rare, orphans: rareOrphan.orphan,
    rareThreshold: rareOrphan.rareThreshold,
    merges: redundant.merges,
    specialisations: redundant.specialisations,
    pairMinSupport: redundant.minSupport,
    undertagged: sceneTags.under,
    overtagged: sceneTags.over,
    underThreshold: sceneTags.underThreshold,
    overThreshold: sceneTags.overThreshold,
    namingInconsistency,
    hierarchyIssues,
  };
}

module.exports = { computeTagOptimization, normalize, singularise, levenshtein };
