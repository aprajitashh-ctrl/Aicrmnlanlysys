import React from 'react';
import { X, Network, User, MapPin, Phone, Car, Building, Share2 } from 'lucide-react';

export default function NodeModal({ node, graphData, onClose, onFocusNode }) {
  if (!node) return null;

  // Find linked connections
  const connectedLinks = graphData?.links?.filter(l => {
    const srcId = typeof l.source === 'object' ? l.source.id : l.source;
    const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
    return srcId === node.id || tgtId === node.id;
  }) || [];

  const connectedNodes = connectedLinks.map(l => {
    const srcId = typeof l.source === 'object' ? l.source.id : l.source;
    const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
    const otherId = srcId === node.id ? tgtId : srcId;
    const otherNode = graphData?.nodes?.find(n => n.id === otherId);
    return {
      node: otherNode || { id: otherId, name: otherId, type: 'Unknown' },
      relationship: l.type || 'CONNECTED_TO'
    };
  });

  const getIcon = (type) => {
    switch (type) {
      case 'Person': return <User size={16} color="#3b82f6" />;
      case 'Location': return <MapPin size={16} color="#10b981" />;
      case 'PhoneNumber': return <Phone size={16} color="#f97316" />;
      case 'Vehicle': return <Car size={16} color="#ef4444" />;
      case 'Organization': return <Building size={16} color="#a855f7" />;
      default: return <Network size={16} color="var(--accent-primary)" />;
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '76px',
      right: '360px',
      zIndex: 40,
      width: '320px',
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto'
    }} className="tactical-card tactical-card-active">
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getIcon(node.type)}
          <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-primary)' }}>
            {node.type} INSPECTOR
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
            {node.name}
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {node.details || 'Identified entity in crime database graph.'}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          padding: '10px',
          background: 'var(--bg-card-hover)',
          borderRadius: '8px',
          fontSize: '11px'
        }}>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Direct Links</span>
            <strong style={{ fontSize: '15px', color: 'var(--accent-primary)' }}>{node.degree || connectedNodes.length}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Entity ID</span>
            <strong style={{ fontSize: '11px', color: '#cbd5e1' }}>{node.id}</strong>
          </div>
        </div>

        {/* Connected Entities */}
        <div>
          <h4 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Direct Network Connections ({connectedNodes.length}):
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            {connectedNodes.map(({ node: target, relationship }, idx) => (
              <div
                key={idx}
                onClick={() => onFocusNode(target.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {getIcon(target.type)}
                  <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>{target.name}</span>
                </div>
                <span style={{ fontSize: '9px', color: 'var(--accent-primary)', background: 'var(--accent-glow)', padding: '2px 5px', borderRadius: '4px' }}>
                  {relationship}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
