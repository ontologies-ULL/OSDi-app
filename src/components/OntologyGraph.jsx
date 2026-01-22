import React, { useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Función auxiliar para ajustar el color
function adjustColor(color, amount) {
  const clamp = (val) => Math.min(Math.max(val, 0), 255);
  const num = parseInt(color.replace('#', ''), 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0x00FF) + amount);
  const b = clamp((num & 0x0000FF) + amount);
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Componente para nodo de entidad - ENVUELTO EN React.memo
const EntityNode = React.memo(({ data }) => {
  const isCompleted = data.name && data.name.trim() !== '';

  return (
    <div style={{
      background: isCompleted ? 'white' : '#F9FAFB',
      border: `3px solid ${isCompleted ? data.color : '#D1D5DB'}`,
      borderRadius: '16px',
      width: '320px',
      boxShadow: isCompleted
        ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      opacity: isCompleted ? 1 : 0.7,
      transition: 'all 0.3s ease',
    }}>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: data.color,
          width: '12px',
          height: '12px',
          border: '2px solid white',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: data.color,
          width: '12px',
          height: '12px',
          border: '2px solid white',
        }}
      />

      <div style={{
        background: isCompleted
          ? `linear-gradient(135deg, ${data.color || '#3B82F6'} 0%, ${adjustColor(data.color || '#3B82F6', -20)} 100%)`
          : '#E5E7EB',
        color: isCompleted ? 'white' : '#6B7280',
        padding: '14px 16px',
        fontWeight: '700',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {data.icon && <span style={{ fontSize: '18px', opacity: isCompleted ? 1 : 0.5 }}>{data.icon}</span>}
          <span>{data.entityType || 'Entity'}</span>
        </div>
        {isCompleted && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.25)',
            borderRadius: '50%',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 4L6 11L3 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {data.name ? (
          <>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '8px',
              lineHeight: '1.3',
            }}>
              {data.name}
            </div>

            {data.description && (
              <div style={{
                fontSize: '12px',
                color: '#6B7280',
                lineHeight: '1.5',
                marginBottom: '12px',
              }}>
                {data.description.length > 80
                  ? data.description.substring(0, 80) + '...'
                  : data.description}
              </div>
            )}

            {data.properties && data.properties.length > 0 && (
              <>
                <div style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#6B7280',
                  marginBottom: '8px',
                  marginTop: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                }}>
                  Propiedades
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                }}>
                  {data.properties.slice(0, 4).map((prop, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: '11px',
                        background: `${data.color}15`,
                        color: data.color,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        border: `1.5px solid ${data.color}40`,
                      }}
                    >
                      {prop.property}
                    </div>
                  ))}
                  {data.properties.length > 4 && (
                    <div style={{
                      fontSize: '11px',
                      background: '#F3F4F6',
                      color: '#6B7280',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: '700',
                      border: '1.5px solid #E5E7EB',
                    }}>
                      +{data.properties.length - 4}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{
            color: '#9CA3AF',
            fontSize: '13px',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '30px 0',
          }}>
            Sin información
          </div>
        )}
      </div>

      <div style={{
        background: isCompleted ? '#F9FAFB' : '#F3F4F6',
        padding: '10px 16px',
        fontSize: '11px',
        color: '#6B7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #E5E7EB',
      }}>
        <span style={{
          background: isCompleted ? '#D1FAE5' : '#FEE2E2',
          color: isCompleted ? '#065F46' : '#991B1B',
          padding: '3px 10px',
          borderRadius: '12px',
          fontWeight: '700',
          fontSize: '10px',
        }}>
          {isCompleted ? '✓ Completo' : '◯ Vacío'}
        </span>
      </div>
    </div>
  );
});

// Agregar displayName para debugging
EntityNode.displayName = 'EntityNode';

// nodeTypes definido FUERA y DESPUÉS de EntityNode
const nodeTypes = {
  entityNode: EntityNode,
};

function OntologyGraph({ diseaseData, developmentData }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const newNodes = [];
    const newEdges = [];

    const diseaseProperties = diseaseData ? [
      ...(diseaseData.datatypeProperties || []),
      ...(diseaseData.references?.hasRefToDO ? [{ property: 'hasRefToDO', value: diseaseData.references.hasRefToDO }] : []),
      ...(diseaseData.references?.hasRefToICD ? [{ property: 'hasRefToICD', value: diseaseData.references.hasRefToICD }] : []),
      ...(diseaseData.references?.hasRefToOMIM ? [{ property: 'hasRefToOMIM', value: diseaseData.references.hasRefToOMIM }] : []),
      ...(diseaseData.references?.hasRefToSNOMED ? [{ property: 'hasRefToSNOMED', value: diseaseData.references.hasRefToSNOMED }] : []),
    ].filter(p => p.property && p.value) : [];

    const developmentProperties = developmentData ? [
      ...(developmentData.datatypeProperties || []),
      ...(developmentData.developmentProperties?.hasAge ? [{ property: 'hasAge', value: developmentData.developmentProperties.hasAge }] : []),
      ...(developmentData.developmentProperties?.hasOnset ? [{ property: 'hasOnset', value: developmentData.developmentProperties.hasOnset }] : []),
      ...(developmentData.developmentProperties?.hasStage ? [{ property: 'hasStage', value: developmentData.developmentProperties.hasStage }] : []),
      ...(developmentData.developmentProperties?.hasSeverity ? [{ property: 'hasSeverity', value: developmentData.developmentProperties.hasSeverity }] : []),
      ...(developmentData.developmentProperties?.hasProgression ? [{ property: 'hasProgression', value: developmentData.developmentProperties.hasProgression }] : []),
      ...(developmentData.developmentProperties?.hasRiskFactor ? [{ property: 'hasRiskFactor', value: developmentData.developmentProperties.hasRiskFactor }] : []),
    ].filter(p => p.property && p.value) : [];

    newNodes.push({
      id: 'disease',
      type: 'entityNode',
      data: {
        entityType: 'Enfermedad',
        icon: '🦠',
        name: diseaseData?.label || '',
        description: diseaseData?.comment || '',
        properties: diseaseProperties,
        color: '#10B981',
      },
      position: { x: 100, y: 200 },
      draggable: true,
    });

    newNodes.push({
      id: 'development',
      type: 'entityNode',
      data: {
        entityType: 'Desarrollo',
        icon: '📈',
        name: developmentData?.label || '',
        description: developmentData?.comment || '',
        properties: developmentProperties,
        color: '#10B981',
      },
      position: { x: 550, y: 200 },
      draggable: true,
    });

    newEdges.push({
      id: 'e-disease-development',
      source: 'disease',
      target: 'development',
      type: 'default',
      animated: false,
      style: {
        stroke: '#0F172A',
        strokeWidth: 3,
      },
      label: 'se desarrolla',
      labelStyle: {
        fill: '#0F172A',
        fontSize: '14px',
        fontWeight: '600',
      },
      labelBgStyle: {
        fill: '#FFFFFF',
        fillOpacity: 0.95,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#0F172A',
        width: 25,
        height: 25,
      },
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [diseaseData, developmentData, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant="dots" gap={16} size={1.5} color="#E5E7EB" />
        <Controls
          showInteractive={false}
          position="top-left"
          style={{
            background: 'white',
            border: '2px solid #E5E7EB',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === 'disease') return '#3B82F6';
            if (node.id === 'development') return '#10B981';
            return '#D1D5DB';
          }}
          maskColor="rgba(0, 0, 0, 0.05)"
          position="bottom-right"
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #E5E7EB',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default OntologyGraph;