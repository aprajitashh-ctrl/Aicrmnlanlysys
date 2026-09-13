import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomIn, ZoomOut, Maximize2, Layers, FilterX } from 'lucide-react';
import { calculateNodeGeoPosition } from '../utils/geoLookup';

const ENTITY_COLORS = {
  Person: '#3b82f6',        // Blue
  Location: '#10b981',      // Green
  PhoneNumber: '#f97316',   // Orange
  Vehicle: '#ef4444',       // Red
  Organization: '#a855f7'   // Purple
};

/**
 * Helper component to control map viewport (zoom to fit bounds)
 */
function MapBoundsController({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [bounds, map]);
  return null;
}

export default function MapView({
  graphData,
  selectedNode,
  onNodeClick,
  activeFilters,
  focusedNodeId
}) {
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [showLabels, setShowLabels] = useState(true);

  // Compute node geo-positions and node index map
  const { nodePositions, filteredData, mapBounds } = useMemo(() => {
    if (!graphData || !graphData.nodes) return { nodePositions: {}, filteredData: { nodes: [], links: [] }, mapBounds: [] };

    // Filter nodes by activeFilters
    const validNodes = graphData.nodes.filter(n => activeFilters[n.type] !== false);
    const validNodeIds = new Set(validNodes.map(n => n.id));

    const validLinks = graphData.links.filter(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return validNodeIds.has(srcId) && validNodeIds.has(tgtId);
    });

    const indexMap = {};
    validNodes.forEach((n, idx) => { indexMap[n.id] = idx + 1; });

    const posMap = {};
    const bounds = [];

    validNodes.forEach(n => {
      const coords = calculateNodeGeoPosition(n, graphData, indexMap);
      posMap[n.id] = coords;
      bounds.push(coords);
    });

    return {
      nodePositions: posMap,
      filteredData: { nodes: validNodes, links: validLinks },
      mapBounds: bounds
    };
  }, [graphData, activeFilters]);

  // Node Click 1-Hop Highlight Logic
  const handleNodeClick = useCallback((node) => {
    if (!node) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
      if (onNodeClick) onNodeClick(null);
      return;
    }

    const newHighlightNodes = new Set([node.id]);
    const newHighlightLinks = new Set();

    filteredData.links.forEach(link => {
      const srcId = typeof link.source === 'object' ? link.source.id : link.source;
      const tgtId = typeof link.target === 'object' ? link.target.id : link.target;

      if (srcId === node.id || tgtId === node.id) {
        newHighlightLinks.add(link);
        newHighlightNodes.add(srcId);
        newHighlightNodes.add(tgtId);
      }
    });

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
    if (onNodeClick) onNodeClick(node);
  }, [filteredData, onNodeClick]);

  // Center on focused node if triggered from right panel
  useEffect(() => {
    if (!focusedNodeId) return;
    const targetNode = filteredData.nodes.find(n => n.id === focusedNodeId);
    if (targetNode) {
      handleNodeClick(targetNode);
    }
  }, [focusedNodeId, filteredData]);

  // Default India Center if no nodes
  const defaultCenter = [20.5937, 78.9629];

  return (
    <div className="tactical-card" style={{
      position: 'relative',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Map Control Toolbar */}
      <div style={{
        position: 'absolute',
        top: '14px',
        left: '14px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-card)',
        padding: '6px 10px',
        borderRadius: '4px',
        border: '1px solid var(--border-color)'
      }}>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className="btn-secondary"
          style={{ padding: '5px 10px', fontSize: '11px' }}
        >
          <Layers size={13} /> {showLabels ? 'Hide Labels' : 'Show Labels'}
        </button>

        {highlightNodes.size > 0 && (
          <button
            onClick={() => handleNodeClick(null)}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '11px', color: '#ef4444' }}
          >
            <FilterX size={13} /> Clear Selection
          </button>
        )}
      </div>

      {/* Helper Legend */}
      <div style={{
        position: 'absolute',
        bottom: '14px',
        left: '14px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg-card)',
        padding: '6px 12px',
        borderRadius: '4px',
        border: '1px solid var(--border-color)',
        fontSize: '11px',
        color: 'var(--text-main)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }}></span> Person
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></span> Location
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', boxShadow: '0 0 6px #f97316' }}></span> Phone
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444' }}></span> Vehicle
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7' }}></span> Org
        </div>
      </div>

      {/* Leaflet Map Component */}
      <MapContainer
        center={defaultCenter}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        {/* OpenStreetMap Standard Tiles — no API key, small attribution only */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" style="font-size:10px;opacity:0.5;">OpenStreetMap contributors</a>'
          maxZoom={19}
        />

        <MapBoundsController bounds={mapBounds} />

        {/* Render Relationship Polylines */}
        {filteredData.links.map((link, idx) => {
          const srcId = typeof link.source === 'object' ? link.source.id : link.source;
          const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
          const pos1 = nodePositions[srcId];
          const pos2 = nodePositions[tgtId];
          if (!pos1 || !pos2) return null;

          const isHighlighted = highlightLinks.size > 0 ? highlightLinks.has(link) : false;
          const isDimmed = highlightLinks.size > 0 && !isHighlighted;

          return (
            <Polyline
              key={idx}
              positions={[pos1, pos2]}
              pathOptions={{
                color: isHighlighted ? '#00f0ff' : '#1e3a5f',
                weight: isHighlighted ? 3.5 : 2,
                opacity: isDimmed ? 0.12 : (isHighlighted ? 1.0 : 0.65),
                dashArray: isHighlighted ? '6, 5' : null
              }}
            />
          );
        })}

        {/* Render Node Markers */}
        {filteredData.nodes.map((node) => {
          const coords = nodePositions[node.id];
          if (!coords) return null;

          const isSelected = selectedNode && selectedNode.id === node.id;
          const isHighlighted = highlightNodes.size > 0 ? highlightNodes.has(node.id) : true;
          const isDimmed = highlightNodes.size > 0 && !isHighlighted;
          const color = ENTITY_COLORS[node.type] || '#3b82f6';
          const radius = 8 + Math.min(14, (node.degree || 1) * 1.8);

          return (
            <CircleMarker
              key={node.id}
              center={coords}
              radius={isSelected ? radius + 5 : radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: isDimmed ? 0.2 : 0.92,
                color: isSelected ? '#00f0ff' : '#1a2744',
                weight: isSelected ? 4 : 2.5,
                opacity: isDimmed ? 0.25 : 1.0
              }}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  handleNodeClick(node);
                }
              }}
            >
              {showLabels && (
                <Tooltip
                  permanent={isSelected || (node.degree >= 5)}
                  direction="top"
                  offset={[0, -radius]}
                  opacity={isDimmed ? 0.3 : 0.95}
                  className="tactical-leaflet-tooltip"
                >
                  <div style={{
                    background: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : color}`,
                    color: 'var(--text-main)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: isSelected ? '700' : '600',
                    boxShadow: isSelected ? '0 4px 16px var(--accent-glow)' : '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    {node.name}
                  </div>
                </Tooltip>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
