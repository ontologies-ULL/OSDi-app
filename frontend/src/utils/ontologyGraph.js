/**
 * @file ontologyGraph.js
 * @brief Utility that converts OSDi disease-model data into ReactFlow nodes and edges.
 *
 * Produces a top-down layered graph with one row per entity type:
 * - Row 0 : Disease node (when a label is available).
 * - Row 1 : Independent manifestations (not embedded in any Development or Stage).
 * - Row 2 : Development nodes (with linked manifestations embedded inside the node).
 * - Row 3 : Stage nodes (with sub-progression elements embedded inside the node).
 *
 * Combination rules are intentionally **not** rendered.
 *
 * @module utils/ontologyGraph
 */

/**
 * @brief Builds a complete ReactFlow graph for the OSDi disease model.
 *
 * Rows are populated only when they contain at least one item. All rows are
 * centred horizontally relative to the widest row. Stages that are only
 * reachable via `hasNext` from another Stage are not given a direct edge from
 * the Disease node — they are connected through the dashed `hasNext` edge
 * instead.
 *
 * @param {Object}   params                                 - Input data for the graph.
 * @param {Object}   params.diseaseData                     - Disease identity object.
 * @param {string}   params.diseaseData.label               - IRI label of the disease individual.
 * @param {string}   [params.diseaseData.comment]           - Optional free-text description (truncated to 65 chars).
 * @param {string[]} [params.diseaseData.selectedSubtypes]  - Array of OWL subtype class names (e.g. `"RareDisease"`).
 * @param {Array<{label: string, type: string, description?: string}>} [params.manifestations=[]]
 *   All manifestation objects (`AcuteManifestation` / `ChronicManifestation`).
 * @param {Array<{label: string, description?: string, linkedProgressions?: string[]}>} [params.developments=[]]
 *   Development objects; `linkedProgressions` lists embedded manifestation labels.
 * @param {Array<{label: string, description?: string, subProgressions?: string[], isOrdered?: boolean, hasNext?: string}>} [params.stages=[]]
 *   Stage objects; `subProgressions` lists embedded manifestation labels.
 *   When `isOrdered` is `true` and `hasNext` is set, a dashed edge is created
 *   to the next Stage.
 *
 * @returns {{ nodes: Object[], edges: Object[] }}
 *   Plain ReactFlow-compatible node and edge arrays ready to be passed to a
 *   `<ReactFlow>` component.
 */
export function buildFullGraph({
  diseaseData,
  manifestations = [],
  developments = [],
  stages = [],
}) {
  const nodes = [];
  const edges = [];

  const hasDisease = Boolean(diseaseData?.label);

  /** 
   * @brief Horizontal spacing (px) between sibling nodes in the same row. 
   */
  const STEP_X = 250;
  /** 
   * @brief Vertical spacing (px) between rows. 
   */
  const STEP_Y = 220;

  // Manifestations embedded inside a Development or Stage
  const embeddedInDev   = new Set(developments.flatMap(d => d.linkedProgressions || []));
  const embeddedInStage = new Set(stages.flatMap(s => s.subProgressions || []));
  const allEmbedded     = new Set([...embeddedInDev, ...embeddedInStage]);

  // Independent manifestations: not embedded anywhere
  const independentManifs = manifestations.filter(m => !allEmbedded.has(m.label));

  // Stages that are 'hasNext' targets → not directly connected to Disease
  const isNextStage = new Set(stages.map(s => s.hasNext).filter(Boolean));

  // Build row groups (skip empty)
  const groups = [
    independentManifs.length > 0 ? { tag: 'manif', items: independentManifs }  : null,
    developments.length       > 0 ? { tag: 'dev',   items: developments }       : null,
    stages.length             > 0 ? { tag: 'stage', items: stages }             : null,
  ].filter(Boolean);

  // If nothing to render at all, return empty
  if (!hasDisease && groups.length === 0) return { nodes, edges };

  const maxItems  = Math.max(1, ...groups.map(g => g.items.length));
  const totalWidth = (maxItems - 1) * STEP_X;

  /**
   * @brief Computes the centred horizontal position for item `i` in a row of `n` items.
   * @param {number} n - Total number of items in the row.
   * @param {number} i - Zero-based index of the item within the row.
   * @returns {number} The x coordinate (in pixels) for the node.
   */
  const xFor = (n, i) => {
    const rowWidth = (n - 1) * STEP_X;
    const startX   = (totalWidth - rowWidth) / 2;
    return startX + i * STEP_X;
  };

  // Disease node (only if label is available)
  if (hasDisease) {
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
  }

  // When there is no disease node, rows start at y=0; otherwise they start at STEP_Y
  const rowOffset = hasDisease ? 1 : 0;
  groups.forEach(({ tag, items }, rowIdx) => {
    const rowY = (rowIdx + rowOffset) * STEP_Y;
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

      // Disease → entity edge (only when disease node exists, skip hasNext-target stages)
      const skipStage = tag === 'stage' && isNextStage.has(item.label);
      if (hasDisease && !skipStage) {
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

  // Stage → next Stage edges (dashed)
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
