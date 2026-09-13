import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import ForceGraph2DComponent from 'react-force-graph-2d';
import { ZoomIn, ZoomOut, Maximize2, Layers, FilterX } from 'lucide-react';

const ENTITY_COLORS = {
  Person: '#3b82f6',        // Vibrant Blue
  Location: '#10b981',      // Emerald Green
  PhoneNumber: '#f97316',   // Sunset Orange
  Vehicle: '#ef4444',       // Crimson Red
  Organization: '#a855f7'   // Deep Purple
};

// Safely resolve ForceGraph2D module export across standard ESM and UMD bundles
const ForceGraph2D = typeof ForceGraph2DComponent === 'function'
  ? ForceGraph2DComponent
  : (ForceGraph2DComponent?.default || null);

export default function GraphView({
  graphData,
  selectedNode,
  onNodeClick,
  activeFilters,
  focusedNodeId, theme
}) {
  const containerRef = useRef(null);
  const fgRef = useRef();

  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [canvasError, setCanvasError] = useState(false);

  // Measure container dimensions dynamically
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 900,
          height: clientHeight || 650
        });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Filter nodes & links based on activeFilters
  const filteredData = useMemo(() => {
    if (!graphData || !graphData.nodes) return { nodes: [], links: [] };

    const validNodes = graphData.nodes.filter(n => activeFilters[n.type] !== false);
    const validNodeIds = new Set(validNodes.map(n => n.id));

    const validLinks = graphData.links.filter(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return validNodeIds.has(srcId) && validNodeIds.has(tgtId);
    });

    return { nodes: validNodes, links: validLinks };
  }, [graphData, activeFilters]);

  // Configure D3 Force Engine for stronger repulsion & increased node spacing
  useEffect(() => {
    if (fgRef.current && filteredData.nodes.length > 0) {
      // Stronger charge repulsion (default is -30, we set to -400 for wide spacing)
      if (fgRef.current.d3Force('charge')) {
        fgRef.current.d3Force('charge').strength(-420);
      }
      // Increased link distance between connected entities
      if (fgRef.current.d3Force('link')) {
        fgRef.current.d3Force('link').distance(95);
      }
      // Center force to keep network balanced in canvas
      if (fgRef.current.d3Force('center')) {
        fgRef.current.d3Force('center').strength(0.8);
      }

      // Re-heat force simulation
      fgRef.current.d3ReheatSimulation();

      // Trigger Zoom to Fit on initial load / graph update
      const fitTimer = setTimeout(() => {
        if (fgRef.current?.zoomToFit) {
          fgRef.current.zoomToFit(500, 60);
        }
      }, 600);

      return () => clearTimeout(fitTimer);
    }
  }, [filteredData]);

  // Handle focus when focusedNodeId, theme prop changes (e.g. clicking key influencer in right panel)
  useEffect(() => {
    if (!focusedNodeId, theme || !fgRef.current) return;
    const targetNode = filteredData.nodes.find(n => n.id === focusedNodeId, theme);
    if (targetNode) {
      if (fgRef.current.centerAt) fgRef.current.centerAt(targetNode.x || 0, targetNode.y || 0, 800);
      if (fgRef.current.zoom) fgRef.current.zoom(3, 800);
      handleNodeClick(targetNode);
    }
  }, [focusedNodeId, theme, filteredData]);

  // Handle Node Click & 1-Hop Highlight Logic
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

  // Custom Node Canvas Renderer with Type-Based Glowing Shadows
  const drawNode = useCallback((node, ctx, globalScale) => {
    if (!node || node.x === undefined || node.y === undefined) return;

    const isSelected = selectedNode && selectedNode.id === node.id;
    const isHighlighted = highlightNodes.size > 0 ? highlightNodes.has(node.id) : true;
    const isHovered = hoverNode && hoverNode.id === node.id;

    // Node Sizing based on degree centrality
    const baseRadius = 6 + Math.min(14, (node.degree || 1) * 1.8);
    const radius = isSelected ? baseRadius + 4 : baseRadius;
    const color = ENTITY_COLORS[node.type] || '#3b82f6';

    ctx.save();

    // Dimming unselected nodes
    ctx.globalAlpha = (highlightNodes.size > 0 && !isHighlighted) ? 0.12 : 1.0;

    // 1. Subtle Glow / Shadow Effect matching Entity Type Color
    if (isHighlighted || isSelected) {
      ctx.shadowColor = isSelected ? '#00f0ff' : color;
      ctx.shadowBlur = isSelected ? 22 : (node.degree >= 4 ? 14 : 10);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // 2. Glowing Halo Ring for selected or high-degree central nodes
    if (isSelected || (node.degree && node.degree >= 4)) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = isSelected ? 'rgba(0, 240, 255, 0.35)' : `${color}35`;
      ctx.fill();
    }

    // 3. Main Node Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    // Reset Shadow for crisp borders and text
    ctx.shadowBlur = 0;

    // 4. Node Border Ring
    ctx.lineWidth = isSelected ? 3.0 : (isHovered ? 2.0 : 1.4);
    ctx.strokeStyle = isSelected ? '#00f0ff' : 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();

    // 5. Draw Labels
    if (showLabels && (globalScale >= 0.9 || isSelected || isHighlighted || isHovered)) {
      const label = node.name || node.id;
      const fontSize = Math.max(11 / globalScale, 3.5);
      ctx.font = `${isSelected ? 'bold ' : '500 '}${fontSize}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const textWidth = ctx.measureText(label).width;
      const bckgDimensions = [textWidth + 8, fontSize + 5];
      ctx.fillStyle = isSelected ? '#00f0ff' : (theme === 'light' ? '#FFFFFF' : '#0F172A');
      ctx.fillRect(
        node.x - bckgDimensions[0] / 2,
        node.y + radius + 5,
        bckgDimensions[0],
        bckgDimensions[1]
      );

      // Label border pill
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = isSelected ? '#00f0ff' : `${color}60`;
      ctx.strokeRect(
        node.x - bckgDimensions[0] / 2,
        node.y + radius + 5,
        bckgDimensions[0],
        bckgDimensions[1]
      );

      ctx.fillStyle = isSelected ? (theme === 'light' ? '#FFFFFF' : '#0F172A') : (theme === 'light' ? '#1A1F2E' : '#F8FAFC');
      ctx.fillText(label, node.x, node.y + radius + 5 + fontSize / 2);
    }

    ctx.restore();
  }, [selectedNode, highlightNodes, hoverNode, showLabels]);

  // Link Canvas Color & Highlight
  const getLinkColor = useCallback((link) => {
    if (highlightLinks.size === 0) return 'rgba(0, 0, 0, 0.15)';
    return highlightLinks.has(link) ? '#00f0ff' : (theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.05)');
  }, [highlightLinks]);

  const getLinkWidth = useCallback((link) => {
    if (highlightLinks.size === 0) return 1.2;
    return highlightLinks.has(link) ? 2.8 : 0.4;
  }, [highlightLinks]);

  return (
    <div
      ref={containerRef}
      className="tactical-card"
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '450px'
      }}
    >
      {/* Graph Toolbar Overlay */}
      <div style={{
        position: 'absolute',
        top: '14px',
        left: '14px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-card)',
        padding: '6px 10px',
        borderRadius: '4px',
        border: '1px solid var(--border-color)'
      }}>
        <button
          onClick={() => fgRef.current?.zoom && fgRef.current.zoom(fgRef.current.zoom() * 1.3, 400)}
          className="btn-secondary"
          style={{ padding: '6px' }}
          title="Zoom In"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => fgRef.current?.zoom && fgRef.current.zoom(fgRef.current.zoom() / 1.3, 400)}
          className="btn-secondary"
          style={{ padding: '6px' }}
          title="Zoom Out"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={() => fgRef.current?.zoomToFit && fgRef.current.zoomToFit(500, 60)}
          className="btn-secondary"
          style={{ padding: '6px' }}
          title="Reset View (Zoom to Fit)"
        >
          <Maximize2 size={14} />
        </button>
        <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }}></div>
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
        zIndex: 10,
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

      {/* Render Force Graph Canvas or SVG Fallback */}
      {ForceGraph2D && !canvasError ? (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={filteredData}
          nodeCanvasObject={drawNode}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkCurvature={0.22}
          linkDirectionalParticles={l => highlightLinks.has(l) ? 3 : 0}
          linkDirectionalParticleSpeed={0.006}
          linkDirectionalParticleWidth={2.5}
          linkDirectionalParticleColor={() => '#00f0ff'}
          linkLabel={l => `${l.type || 'CONNECTED_TO'}`}
          onNodeClick={handleNodeClick}
          onNodeHover={setHoverNode}
          onBackgroundClick={() => handleNodeClick(null)}
          cooldownTicks={150}
          backgroundColor={theme === 'light' ? '#F4F3EE' : '#0B0F19'}
          onError={(err) => {
            console.error('[GraphView] ForceGraph Canvas error:', err);
            setCanvasError(true);
          }}
        />
      ) : (
        /* SVG Interactive Fallback Graph Visualizer */
        <SvgFallbackGraph theme={theme}
          graphData={filteredData}
          selectedNode={selectedNode}
          highlightNodes={highlightNodes}
          onNodeClick={handleNodeClick}
          dimensions={dimensions}
          showLabels={showLabels}
        />
      )}
    </div>
  );
}

/**
 * Interactive SVG Fallback Graph Component with Curved Edges & Glowing Shadows
 */
function SvgFallbackGraph({ graphData, selectedNode, highlightNodes, onNodeClick, dimensions, showLabels, theme }) {
  const { width, height } = dimensions;

  // Calculate layout positions in a wide circle grid
  const nodePositions = useMemo(() => {
    const map = {};
    const nodes = graphData.nodes || [];
    const count = nodes.length;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;

    nodes.forEach((n, idx) => {
      const angle = (idx / Math.max(1, count)) * 2 * Math.PI;
      map[n.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    return map;
  }, [graphData.nodes, width, height]);

  return (
    <svg width={width} height={height} style={{ background: '#080c17', cursor: 'grab' }}>
      <defs>
        <radialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
        </radialGradient>
        {Object.entries(ENTITY_COLORS).map(([type, color]) => (
          <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>

      {/* Render Curved Links */}
      {graphData.links?.map((link, idx) => {
        const srcId = typeof link.source === 'object' ? link.source.id : link.source;
        const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
        const pos1 = nodePositions[srcId];
        const pos2 = nodePositions[tgtId];
        if (!pos1 || !pos2) return null;

        const isHighlighted = highlightNodes.size > 0 && highlightNodes.has(srcId) && highlightNodes.has(tgtId);
        const opacity = highlightNodes.size > 0 ? (isHighlighted ? 0.9 : 0.1) : 0.45;

        // Quadratic Bezier Curve Control Point
        const midX = (pos1.x + pos2.x) / 2;
        const midY = (pos1.y + pos2.y) / 2;
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const ctrlX = midX - dy * 0.18;
        const ctrlY = midY + dx * 0.18;

        return (
          <path
            key={idx}
            d={`M ${pos1.x} ${pos1.y} Q ${ctrlX} ${ctrlY} ${pos2.x} ${pos2.y}`}
            fill="none"
            stroke={isHighlighted ? '#00f0ff' : 'rgba(255, 255, 255, 0.2)'}
            strokeWidth={isHighlighted ? 2.5 : 1.2}
            strokeOpacity={opacity}
          />
        );
      })}

      {/* Render Glowing Nodes */}
      {graphData.nodes?.map((node) => {
        const pos = nodePositions[node.id];
        if (!pos) return null;

        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHighlighted = highlightNodes.size > 0 ? highlightNodes.has(node.id) : true;
        const color = ENTITY_COLORS[node.type] || '#3b82f6';
        const r = 9 + Math.min(12, (node.degree || 1) * 1.6);
        const opacity = highlightNodes.size > 0 ? (isHighlighted ? 1.0 : 0.18) : 1.0;

        return (
          <g
            key={node.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick(node);
            }}
            style={{ cursor: 'pointer', opacity }}
            filter={`url(#glow-${node.type})`}
          >
            {/* Glow Ring */}
            {isSelected && (
              <circle r={r + 8} fill="url(#cyanGlow)" />
            )}

            {/* Main Node */}
            <circle
              r={r}
              fill={color}
              stroke={isSelected ? '#00f0ff' : 'rgba(255,255,255,0.8)'}
              strokeWidth={isSelected ? 3.5 : 1.6}
            />

            {/* Label */}
            {showLabels && (
              <text
                y={r + 15}
                textAnchor="middle"
                fill={isSelected ? '#00f0ff' : (theme === 'light' ? '#1A1F2E' : '#F8FAFC')}
                fontSize="11"
                fontWeight={isSelected ? 'bold' : '500'}
                style={{ pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
              >
                {node.name || node.id}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
