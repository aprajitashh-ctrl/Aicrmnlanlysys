import React, { useState } from 'react';
import { Filter, Search, User, MapPin, Phone, Car, Building, Sparkles, Terminal, X, RefreshCw } from 'lucide-react';

export default function Sidebar({
  filters,
  setFilters,
  onSearch,
  nodeCounts,
  onResetSearch,
  activeSearchQuery,
  cypherQuery
}) {
  const [searchInput, setSearchInput] = useState('');
  const [searching, setSearching] = useState(false);

  const handleToggle = (type) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearching(true);
    try {
      await onSearch(searchInput);
    } finally {
      setSearching(false);
    }
  };

  const handlePresetSearch = async (queryText) => {
    setSearchInput(queryText);
    setSearching(true);
    try {
      await onSearch(queryText);
    } finally {
      setSearching(false);
    }
  };

  const entityTypes = [
    { key: 'Person', label: 'People', icon: User, color: '#3b82f6', badgeClass: 'badge-person' },
    { key: 'Location', label: 'Locations', icon: MapPin, color: '#10b981', badgeClass: 'badge-location' },
    { key: 'PhoneNumber', label: 'Phone Numbers', icon: Phone, color: '#f97316', badgeClass: 'badge-phone' },
    { key: 'Vehicle', label: 'Vehicles', icon: Car, color: '#ef4444', badgeClass: 'badge-vehicle' },
    { key: 'Organization', label: 'Organizations', icon: Building, color: '#a855f7', badgeClass: 'badge-org' }
  ];

  return (
    <aside className="tactical-card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '18px',
      padding: '16px',
      height: '100%',
      overflowY: 'auto'
    }}>
      {/* 1. Entity Filters Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="var(--accent-primary)" />
            Entity Filters
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active layers</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {entityTypes.map(({ key, label, icon: Icon, color }) => {
            const count = nodeCounts[key] || 0;
            const checked = filters[key];
            return (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  background: checked ? 'var(--bg-card-hover)' : 'transparent',
                  border: `1px solid ${checked ? 'var(--border-color)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(key)}
                    style={{ accentColor: color, width: '15px', height: '15px', cursor: 'pointer' }}
                  />
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 8px ${color}`
                  }}></div>
                  <Icon size={14} color={color} />
                  <span style={{ fontSize: '12px', fontWeight: '500', color: checked ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {label}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color,
                  background: `${color}15`,
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}>
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />

      {/* 2. Natural Language AI Graph Search */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--accent-primary)" />
            AI Cypher Search
          </h2>
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="e.g. Who is connected to Rahul?"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '9px 12px 9px 34px',
                color: 'var(--text-main)',
                fontSize: '12px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            />
            <Search size={14} color="var(--accent-primary)" style={{ position: 'absolute', left: '11px', top: '11px' }} />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="submit"
              disabled={searching || !searchInput.trim()}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '12px' }}
            >
              {searching ? (
                <>
                  <RefreshCw size={13} className="spin" /> Converting via Gemini...
                </>
              ) : (
                <>
                  <Sparkles size={13} /> Run AI Search
                </>
              )}
            </button>

            {activeSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  onResetSearch();
                }}
                className="btn-secondary"
                title="Reset Search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        {/* Demo Quick Presets */}
        <div style={{ marginTop: '12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Demo Presets:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {['Rahul', 'Vikram', '+91-98765', 'Nhava Sheva'].map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetSearch(`Show connections for ${preset}`)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🔍 {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Cypher Query Output Card */}
        {cypherQuery && (
          <div style={{
            marginTop: '12px',
            padding: '10px',
            borderRadius: '4px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Terminal size={12} color="var(--accent-primary)" />
              <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: '700' }}>GEMINI CYPHER TRANSLATION</span>
            </div>
            <code style={{ fontSize: '10px', color: 'var(--accent-primary)', wordBreak: 'break-all' }}>
              {cypherQuery}
            </code>
          </div>
        )}
      </div>
    </aside>
  );
}
