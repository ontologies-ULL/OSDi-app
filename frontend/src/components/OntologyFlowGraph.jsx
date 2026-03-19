/**
 * @file OntologyFlowGraph.jsx
 * @brief ReactFlow-based interactive graph for visualising the OSDi ontology model.
 *
 * Renders a read-only (non-connectable) ReactFlow canvas with a custom node
 * type (`OntologyNode`) that visually encodes the OWL class of each individual.
 * When `nodesProp` is empty the component shows a friendly empty-state message
 * instead of an empty canvas.
 *
 * Node types rendered:
 * - `Disease`, `AcuteManifestation`, `ChronicManifestation`
 * - `CoexistentDiseaseProgressionSet`, `AlternativeDiseaseProgressionSet`,
 *   `SequentialDiseaseProgressionSet`
 * - `Development`, `Stage`
 *
 * @module components/OntologyFlowGraph
 */

import { useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { GitBranch } from 'lucide-react';

/**
 * @brief Visual style configuration keyed by OWL ontology type string.
 *
 * Each entry defines the background colour, border colour, text colour, and
 * a localised badge label used inside `OntologyNode`.
 *
 * @type {Object.<string, {bg: string, border: string, text: string, badge: string}>}
 */
const TYPE_CONFIG = {
  Disease:                          { bg: '#d1fae5', border: '#059669', text: '#065f46', badge: 'Enfermedad' },
  AcuteManifestation:               { bg: '#fef9c3', border: '#ca8a04', text: '#713f12', badge: 'Manifestación Aguda' },
  ChronicManifestation:             { bg: '#fef3c7', border: '#d97706', text: '#78350f', badge: 'Manifestación Crónica' },
  CoexistentDiseaseProgressionSet:  { bg: '#f0fdfa', border: '#0d9488', text: '#134e4a', badge: 'Regla Coexistente' },
  AlternativeDiseaseProgressionSet: { bg: '#f0fdfa', border: '#0d9488', text: '#134e4a', badge: 'Regla Alternativa' },
  SequentialDiseaseProgressionSet:  { bg: '#f0fdfa', border: '#0d9488', text: '#134e4a', badge: 'Regla Secuencial' },
  Development:                      { bg: '#eef2ff', border: '#4338ca', text: '#1e1b4b', badge: 'Desarrollo' },
  Stage:                            { bg: '#fdf4ff', border: '#a21caf', text: '#581c87', badge: 'Etapa' },
};

/**
 * @brief Colour tokens for embedded manifestation chips inside Development / Stage nodes.
 * @type {Object.<string, {color: string, bg: string, badge: string}>}
 */
const MANIF_STYLE = {
  AcuteManifestation:   { color: '#ca8a04', bg: '#fef9c3', badge: 'Aguda' },
  ChronicManifestation: { color: '#d97706', bg: '#fef3c7', badge: 'Crónica' },
};

/**
 * @brief Custom ReactFlow node that renders an OSDi ontology individual.
 *
 * Displays a badge (OWL class), a label (individual IRI), an optional subtitle,
 * and — for Development / Stage nodes — an embedded list of linked manifestations.
 * Four ReactFlow handles (top, bottom, left, right) allow edges to attach from
 * any direction.
 *
 * @param {Object}          props.data             - Node data payload from ReactFlow.
 * @param {string}          props.data.label       - IRI label of the individual.
 * @param {string}          props.data.nodeType    - OWL class name; used to look up `TYPE_CONFIG`.
 * @param {string}          [props.data.subtitle]  - Optional subtitle text; `'\n'` inserts line breaks.
 * @param {Array<{label: string, type: string, description?: string}>} [props.data.children]
 *   Embedded manifestation objects shown inside the node body.
 *
 * @returns {JSX.Element} The rendered ontology node.
 */
function OntologyNode({ data }) {
  const cfg = TYPE_CONFIG[data.nodeType] || TYPE_CONFIG.Disease;
  const hasChildren = data.children && data.children.length > 0;
  return (
    <div style={{
      background: cfg.bg,
      border: `2px solid ${cfg.border}`,
      borderRadius: 10,
      padding: '7px 12px',
      minWidth: data.nodeType === 'Disease' ? 170 : 140,
      maxWidth: hasChildren ? 260 : (data.nodeType === 'Disease' ? 240 : 210),
      boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
      fontFamily: 'sans-serif',
    }}>
      <Handle type="target" position={Position.Top}   style={{ background: cfg.border, width: 7, height: 7 }} />
      <Handle type="target" position={Position.Left}  style={{ background: cfg.border, width: 7, height: 7 }} />

      {/* Class badge */}
      <div style={{
        fontSize: 8,
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: cfg.border,
        marginBottom: 3,
      }}>
        {cfg.badge}
      </div>

      {/* Individual label */}
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: cfg.text,
        wordBreak: 'break-word',
        lineHeight: 1.35,
      }}>
        {data.label}
      </div>

      {/* Optional subtitle — supports multiline via '\n' separator */}
      {data.subtitle && data.subtitle.split('\n').map((line, i) => (
        <div key={i} style={{
          marginTop: i === 0 ? 4 : 2,
          fontSize: 9,
          color: cfg.border,
          opacity: 0.78,
          fontStyle: 'italic',
          wordBreak: 'break-word',
          lineHeight: 1.35,
        }}>
          {line}
        </div>
      ))}

      {/* Embedded manifestations (children of Development / Stage nodes) */}
      {hasChildren && (
        <div style={{ marginTop: 8, borderTop: `1px solid ${cfg.border}40`, paddingTop: 6 }}>
          <div style={{
            fontSize: 7, fontWeight: 900, textTransform: 'uppercase',
            color: cfg.border, opacity: 0.7, marginBottom: 4, letterSpacing: '0.05em',
          }}>
            Manifestaciones
          </div>
          {data.children.map((child, ci) => {
            const ms = MANIF_STYLE[child.type] || MANIF_STYLE.AcuteManifestation;
            return (
              <div key={ci} style={{
                marginBottom: ci < data.children.length - 1 ? 4 : 0,
                padding: '3px 6px',
                background: ms.bg,
                borderRadius: 5,
                border: `1px solid ${ms.color}30`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{
                    fontSize: 7, fontWeight: 900, textTransform: 'uppercase',
                    color: ms.color, background: `${ms.color}20`,
                    padding: '1px 4px', borderRadius: 3, flexShrink: 0,
                  }}>
                    {ms.badge}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#374151', wordBreak: 'break-word' }}>
                    {child.label}
                  </span>
                </div>
                {child.description && (
                  <div style={{
                    fontSize: 8, color: '#6b7280', marginTop: 2,
                    wordBreak: 'break-word', lineHeight: 1.3, fontStyle: 'italic',
                  }}>
                    {child.description.slice(0, 70)}{child.description.length > 70 ? '…' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: cfg.border, width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right}  style={{ background: cfg.border, width: 7, height: 7 }} />
    </div>
  );
}

/** @brief ReactFlow node-type registry mapping the `'ontology'` type key to `OntologyNode`. */
const nodeTypes = { ontology: OntologyNode };

/**
 * @brief Interactive (read-only) ReactFlow canvas for the OSDi ontology graph.
 *
 * Syncs `nodesProp` and `edgesProp` into internal ReactFlow state via `useEffect`
 * so the graph updates whenever the parent re-computes the layout. When no nodes
 * are provided an empty-state illustration and message are shown instead.
 *
 * @param {Object[]} props.nodes          - ReactFlow node descriptors (from `buildFullGraph`).
 * @param {Object[]} props.edges          - ReactFlow edge descriptors (from `buildFullGraph`).
 * @param {string}   [props.emptyMessage] - Custom message shown when `nodes` is empty.
 *
 * @returns {JSX.Element} The rendered ReactFlow canvas or empty-state view.
 */
export default function OntologyFlowGraph({ nodes: nodesProp, edges: edgesProp, emptyMessage }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(nodesProp);
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesProp);

  useEffect(() => { setNodes(nodesProp); }, [nodesProp, setNodes]);
  useEffect(() => { setEdges(edgesProp); }, [edgesProp, setEdges]);

  if (nodesProp.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 p-8">
        <GitBranch className="w-12 h-12 text-slate-300" />
        <p className="text-sm italic text-center">
          {emptyMessage || 'Añade elementos para ver el grafo ontológico'}
        </p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.25, minZoom: 0.3 }}
      minZoom={0.2}
      maxZoom={2.5}
      nodesDraggable
      nodesConnectable={false}
      elementsSelectable
      defaultEdgeOptions={{
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        markerEnd: { type: 'arrowclosed', color: '#94a3b8' },
        labelStyle: { fontSize: 8, fill: '#6b7280', fontFamily: 'sans-serif' },
        labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.85, rx: 3, ry: 3 },
        labelBgPadding: [3, 4],
      }}
    >
      <Background color="#e2e8f0" gap={20} size={1} />
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  );
}
