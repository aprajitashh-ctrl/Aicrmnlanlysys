import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import GraphView from './components/GraphView';
import MapView from './components/MapView';
import RightPanel from './components/RightPanel';
import AnalyzeFIR from './components/AnalyzeFIR';
import NodeModal from './components/NodeModal';
import EvidenceLedger from './components/EvidenceLedger';
import { fetchGraphData, fetchInsights, fetchSuspicious, analyzeFIRText, searchNetwork } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'analyze'
  const [viewMode, setViewMode] = useState('map');         // 'map' | 'graph'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Graph & Metrics State
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [insights, setInsights] = useState(null);
  const [suspiciousData, setSuspiciousData] = useState(null);

  // Interaction State
  const [selectedNode, setSelectedNode] = useState(null);
  const [focusedNodeId, setFocusedNodeId] = useState(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [cypherQuery, setCypherQuery] = useState('');

  // Active Entity Filters
  const [filters, setFilters] = useState({
    Person: true,
    Location: true,
    PhoneNumber: true,
    Vehicle: true,
    Organization: true
  });

  // Load All Network Data from Backend
  const loadNetworkData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [gData, insData, suspData] = await Promise.all([
        fetchGraphData(),
        fetchInsights(),
        fetchSuspicious()
      ]);
      setGraphData(gData);
      setInsights(insData);
      setSuspiciousData(suspData);
    } catch (err) {
      console.error('Failed to load criminal network data:', err);
      setError('Could not connect to backend server. Make sure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNetworkData();
  }, [loadNetworkData]);

  // Compute node counts per type
  const nodeCounts = useMemo(() => {
    const counts = { Person: 0, Location: 0, PhoneNumber: 0, Vehicle: 0, Organization: 0 };
    if (graphData && graphData.nodes) {
      graphData.nodes.forEach(n => {
        if (counts[n.type] !== undefined) counts[n.type]++;
      });
    }
    return counts;
  }, [graphData]);

  // Handle Search Submission
  const handleSearch = async (queryText) => {
    setActiveSearchQuery(queryText);
    setLoading(true);
    try {
      const result = await searchNetwork(queryText);
      setGraphData({ nodes: result.nodes, links: result.links });
      if (result.cypherQuery) {
        setCypherQuery(result.cypherQuery);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset Search Filter back to full graph
  const handleResetSearch = async () => {
    setActiveSearchQuery('');
    setCypherQuery('');
    await loadNetworkData();
  };

  // Handle FIR Text Submission
  const handleFIRAnalyze = async (firText) => {
    const result = await analyzeFIRText(firText);
    if (result.graph) {
      setGraphData(result.graph);
    }
    // Refresh insights & suspicious metrics
    fetchInsights().then(setInsights).catch(() => {});
    fetchSuspicious().then(setSuspiciousData).catch(() => {});
    return result;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        stats={{
          totalEntities: graphData.nodes?.length || 0,
          totalConnections: graphData.links?.length || 0,
          suspiciousCount: suspiciousData?.suspiciousEntities?.length || 0
        }}
        onRefresh={loadNetworkData}
        loading={loading}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Content Body */}
      <main style={{ flex: 1, position: 'relative' }}>
        {error && (
          <div style={{
            margin: '12px',
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>⚠️ {error}</span>
            <button className="btn-secondary" onClick={loadNetworkData} style={{ fontSize: '11px' }}>
              Retry Connection
            </button>
          </div>
        )}

        {/* TAB 1: Live Interactive Network Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            {/* Left Sidebar Filters & Search */}
            <Sidebar
              filters={filters}
              setFilters={setFilters}
              onSearch={handleSearch}
              nodeCounts={nodeCounts}
              onResetSearch={handleResetSearch}
              activeSearchQuery={activeSearchQuery}
              cypherQuery={cypherQuery}
            />

            {/* Center Visualizer: Real India Map View vs Force Graph View */}
            <ErrorBoundary>
              {viewMode === 'map' ? (
                <MapView
                  graphData={graphData}
                  selectedNode={selectedNode}
                  onNodeClick={setSelectedNode}
                  activeFilters={filters}
                  focusedNodeId={focusedNodeId}
                />
              ) : (
                <GraphView
                  graphData={graphData}
                  selectedNode={selectedNode}
                  onNodeClick={setSelectedNode}
                  activeFilters={filters}
                  focusedNodeId={focusedNodeId}
                  theme={theme}
                />
              )}
            </ErrorBoundary>

            {/* Right Panel Key Influencers & Suspicious Patterns */}
            <RightPanel
              insights={insights}
              suspiciousData={suspiciousData}
              onSelectEntity={(id) => {
                setFocusedNodeId(id);
                const nodeObj = graphData.nodes.find(n => n.id === id);
                if (nodeObj) setSelectedNode(nodeObj);
              }}
            />
          </div>
        )}

        {activeTab === 'evidence' && <EvidenceLedger theme={theme} />}

        {/* TAB 2: Analyze FIR Report View */}
        {activeTab === 'analyze' && (
          <AnalyzeFIR
            onAnalyzeComplete={handleFIRAnalyze}
            onNavigateToGraph={() => setActiveTab('dashboard')}
          />
        )}

        {/* Selected Node Details Popover */}
        {selectedNode && activeTab === 'dashboard' && (
          <NodeModal
            node={selectedNode}
            graphData={graphData}
            onClose={() => setSelectedNode(null)}
            onFocusNode={(id) => {
              setFocusedNodeId(id);
              const nodeObj = graphData.nodes.find(n => n.id === id);
              if (nodeObj) setSelectedNode(nodeObj);
            }}
          />
        )}
      </main>
    </div>
  );
}
