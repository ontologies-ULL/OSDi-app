/**
 * buildFullGraph — computes ReactFlow nodes and edges for the full OSDi disease model.
 *
 * Layout (top-down, row per entity type):
 *   Row 0 : Disease
 *   Row 1 : Independent manifestations (not linked to any dev / stage)
 *   Row 2 : Developments  (linked manifestations embedded inside the node)
 *   Row 3 : Stages        (sub-progressions embedded inside the node)
 *
 * Combination rules are intentionally NOT rendered in the graph.
 *
 * Edge palette:
 *   green (#10b981)  Disease → any top-level element
 *   cyan  (#06b6d4)  Stage → next Stage  hasNext  (dashed)
 */
export function buildFullGraph({
  diseaseData,
  manifestations = [],
  combinationRules = [],   // kept for API compat, not rendered
  developments = [],
  stages = [],
}) {
  const nodes = [];
  const edges = [];

  if (!diseaseData?.label) return { nodes, edges };

  const STEP_X = 250;
  const STEP_Y = 220;

  // Manifestations embedded inside a Development or Stage — no separate node created
  const embeddedInDev   = new Set(developments.flatMap(d => d.linkedProgressions || []));
  const embeddedInStage = new Set(stages.flatMap(s => s.subProgressions || []));
  const allEmbedded     = new Set([...embeddedInDev, ...embeddedInStage]);

  // Independent manifestations: not embedded anywhere
  const independentManifs = manifestations.filter(m => !allEmbedded.has(m.label));

  // Stages that are 'hasNext' targets → not directly connected to Disease
  const isNextStage = new Set(stages.map(s => s.hasNext).filter(Boolean));

  // ── Build row groups (skip empty) ────────────────────────────────────────────
  const groups = [
    independentManifs.length > 0 ? { tag: 'manif', items: independentManifs }  : null,
    developments.length       > 0 ? { tag: 'dev',   items: developments }       : null,
    stages.length             > 0 ? { tag: 'stage', items: stages }             : null,
  ].filter(Boolean);

  const maxItems  = Math.max(1, ...groups.map(g => g.items.length));
  const totalWidth = (maxItems - 1) * STEP_X;

  const xFor = (n, i) => {
    const rowWidth = (n - 1) * STEP_X;
    const startX   = (totalWidth - rowWidth) / 2;
    return startX + i * STEP_X;
  };

  // ── Disease node ────────────────────────────────────────────────────────────
  const subtypePart = diseaseData.selectedSubtypes?.length > 0
    ? diseaseData.selectedSubtypes.map(s => s.replace('Disease', '')).join(' · ')
    : null;
  const descPart = diseaseData.comment
    ? diseaseData.comment.slice(0, 65) + (diseaseData.comment.length > 65 ? '…' : '')
    : null;

  nodes.push({
    id:   'disease',
    type: 'ontology',
    data: {
      label:    diseaseData.label,
      nodeType: 'Disease',
      subtitle: [subtypePart, descPart].filter(Boolean).join('\n') || null,
    },
    position: { x: totalWidth / 2, y: 0 },
  });

  // ── Entity rows ──────────────────────────────────────────────────────────────
  groups.forEach(({ tag, items }, rowIdx) => {
    const rowY = (rowIdx + 1) * STEP_Y;
    const n    = items.length;

    items.forEach((item, i) => {
      let nodeId, nodeType;
      if (tag === 'manif') { nodeId = `m_${item.label}`;  nodeType = item.type; }
      if (tag === 'dev')   { nodeId = `d_${item.label}`;  nodeType = 'Development'; }
      if (tag === 'stage') { nodeId = `s_${item.label}`;  nodeType = 'Stage'; }

      const nodeData = { label: item.label, nodeType };

      if (tag === 'manif') {
        // Independent manifestation — show description as subtitle
        if (item.description) nodeData.subtitle = item.description;
      }

      if (tag === 'dev') {
        // Development — embed linked manifestations inside the node
        if (item.description) nodeData.subtitle = item.description;
        const linkedManifs = (item.linkedProgressions || [])
          .map(l => manifestations.find(m => m.label === l))
          .filter(Boolean);
        if (linkedManifs.length > 0) nodeData.children = linkedManifs;
      }

      if (tag === 'stage') {
        // Stage — embed sub-progressions inside the node
        if (item.description) nodeData.subtitle = item.description;
        const subManifs = (item.subProgressions || [])
          .map(l => manifestations.find(m => m.label === l))
          .filter(Boolean);
        if (subManifs.length > 0) nodeData.children = subManifs;
      }

      nodes.push({
        id:   nodeId,
        type: 'ontology',
        data: nodeData,
        position: { x: xFor(n, i), y: rowY },
      });

      // Disease → entity edge (skip hasNext-target stages)
      const skipStage = tag === 'stage' && isNextStage.has(item.label);
      if (!skipStage) {
        edges.push({
          id:        `e_dis_${nodeId}`,
          source:    'disease',
          target:    nodeId,
          style:     { stroke: '#10b981', strokeWidth: 1.5 },
          markerEnd: { type: 'arrowclosed', color: '#10b981' },
        });
      }
    });
  });

  // ── Stage hasNext edges (ordered chains) ─────────────────────────────────────
  stages.forEach(s => {
    if (s.isOrdered && s.hasNext) {
      edges.push({
        id:        `e_snx_${s.label}_${s.hasNext}`,
        source:    `s_${s.label}`,
        target:    `s_${s.hasNext}`,
        style:     { stroke: '#06b6d4', strokeWidth: 1.5, strokeDasharray: '6,3' },
        markerEnd: { type: 'arrowclosed', color: '#06b6d4' },
        label:     'hasNext',
        labelStyle:   { fontSize: 8, fill: '#155e75',  fontFamily: 'sans-serif' },
        labelBgStyle: { fill: '#ecfeff', fillOpacity: 0.95, rx: 3, ry: 3 },
        labelBgPadding: [3, 5],
      });
    }
  });

  return { nodes, edges };
}
