import React from 'react';
import { ShieldAlert, Network, FileSearch, RefreshCw, Activity, AlertTriangle, MapPin, Sun, Moon, Database } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  viewMode,
  setViewMode,
  stats,
  onRefresh,
  loading,
  theme,
  toggleTheme
}) {
  return (
    <header style={{
      height: '66px',
      background: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Brand Logo & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <ShieldAlert size={20} color="var(--accent-primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '0.5px', color: '#f8fafc', margin: 0 }}>
            Setu
          </h1>
        </div>
      </div>

      {/* Center View Mode Switcher (Map View vs Graph View) */}
      {activeTab === 'dashboard' && (
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '4px',
          borderRadius: '24px',
        }}>
          <button
            onClick={() => setViewMode('map')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              transition: 'all 0.2s ease',
              background: viewMode === 'map' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'map' ? '#0F172A' : '#94a3b8',
              boxShadow: viewMode === 'map' ? '0 2px 10px var(--accent-glow)' : 'none'
            }}
          >
            <MapPin size={13} />
            India Map View
          </button>
          <button
            onClick={() => setViewMode('graph')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              transition: 'all 0.2s ease',
              background: viewMode === 'graph' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'graph' ? '#0F172A' : '#94a3b8',
              boxShadow: viewMode === 'graph' ? '0 2px 10px var(--accent-glow)' : 'none'
            }}
          >
            <Network size={13} />
            Force Graph View
          </button>
        </div>
      )}

      {/* Live Stats Counters & Main Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '6px 14px',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Network size={14} color="#94a3b8" />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Entities:</span>
            <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{stats.totalEntities || 0}</strong>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} color="#94a3b8" />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Links:</span>
            <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{stats.totalConnections || 0}</strong>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} color="#ef4444" />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Suspicious:</span>
            <strong style={{ fontSize: '13px', color: '#ef4444' }}>{stats.suspiciousCount || 0}</strong>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '4px',
          borderRadius: '24px'
        }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              transition: 'all 0.2s ease',
              background: activeTab === 'dashboard' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'dashboard' ? '#0F172A' : '#94a3b8',
              boxShadow: activeTab === 'dashboard' ? '0 2px 10px var(--accent-glow)' : 'none'
            }}
          >
            <Network size={14} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              background: activeTab === 'analyze' ? 'var(--accent-gradient)' : 'transparent',
              color: activeTab === 'analyze' ? 'var(--bg-card)' : '#94a3b8'
            }}
          >
            <FileSearch size={14} />
            Analyze Report
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              transition: 'all 0.2s ease',
              background: activeTab === 'evidence' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'evidence' ? '#0F172A' : '#94a3b8',
              boxShadow: activeTab === 'evidence' ? '0 2px 10px var(--accent-glow)' : 'none'
            }}
          >
            <Database size={14} />
            Evidence Ledger
          </button>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '8px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: 'rgba(0, 0, 0, 0.2)',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '8px 14px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            fontSize: '13px'
          }}
          title="Refresh Network Data"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </header>
  );
}
