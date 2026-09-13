import React, { useState } from 'react';
import { Award, AlertTriangle, ChevronRight, Activity, ShieldAlert, Zap } from 'lucide-react';

export default function RightPanel({
  insights,
  suspiciousData,
  onSelectEntity
}) {
  const [activeSubTab, setActiveSubTab] = useState('influencers');

  const topInfluencers = insights?.topInfluencers || [];
  const suspiciousList = suspiciousData?.suspiciousEntities || [];

  return (
    <aside className="tactical-card" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden'
    }}>
      {/* Sub-Tab Header */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)'
      }}>
        <button
          onClick={() => setActiveSubTab('influencers')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 10px',
            border: 'none',
            background: activeSubTab === 'influencers' ? 'var(--bg-card-hover)' : 'transparent',
            borderBottom: activeSubTab === 'influencers' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeSubTab === 'influencers' ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Award size={15} />
          Key Influencers ({topInfluencers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('suspicious')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 10px',
            border: 'none',
            background: activeSubTab === 'suspicious' ? 'var(--bg-card-hover)' : 'transparent',
            borderBottom: activeSubTab === 'suspicious' ? '2px solid #f97316' : '2px solid transparent',
            color: activeSubTab === 'suspicious' ? '#f97316' : 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <AlertTriangle size={15} />
          Suspicious ({suspiciousList.length})
        </button>
      </div>

      {/* Content Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: 'var(--bg-card)' }}>

        {/* 1. KEY INFLUENCERS TAB */}
        {activeSubTab === 'influencers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Ranked by Degree Centrality (# of connections)
              </span>
            </div>

            {topInfluencers.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No influencer metrics calculated yet.
              </div>
            ) : (
              topInfluencers.map((item) => {
                const badgeClass = `badge-${item.type?.toLowerCase().replace('phonenumber', 'phone')}`;
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectEntity(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '20px',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-card-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '20px',
                        background: item.rank === 1 ? '#F97316' : 'var(--bg-card-hover)',
                        border: item.rank === 1 ? '1px solid #F97316' : '1px solid var(--border-color)',
                        color: item.rank === 1 ? 'var(--bg-card)' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        #{item.rank}
                      </div>

                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '2px' }}>
                          {item.name}
                        </div>
                        <span className={`badge ${badgeClass}`}>
                          {item.type}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                        {item.connections}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>links</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 2. SUSPICIOUS PATTERNS TAB */}
        {activeSubTab === 'suspicious' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              padding: '10px',
              borderRadius: '20px',
              background: 'rgba(185, 28, 28, 0.05)',
              border: '1px solid rgba(185, 28, 28, 0.2)',
              fontSize: '11px',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldAlert size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <div>
                <strong>Anomaly Rule:</strong> Entities with degree &gt; 2x network average ({suspiciousData?.threshold || '2.0'} links).
              </div>
            </div>

            {suspiciousList.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                No anomalous entities detected above threshold.
              </div>
            ) : (
              suspiciousList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectEntity(item.id)}
                  style={{
                    padding: '12px',
                    borderRadius: '20px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {item.name}
                    </div>
                    <span style={{
                      background: 'var(--bg-card)',
                      color: item.threatLevel === 'CRITICAL' ? '#ef4444' : '#f97316',
                      border: `1px solid ${item.threatLevel === 'CRITICAL' ? '#ef4444' : '#f97316'}`,
                      padding: '2px 6px',
                      borderRadius: '20px',
                      fontSize: '10px',
                      fontWeight: '700'
                    }}>
                      {item.threatLevel}
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    ⚠️ {item.reason}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Connections: <strong style={{ color: 'var(--accent-primary)' }}>{item.connections}</strong></span>
                    <span style={{ color: '#ef4444', fontWeight: '700' }}>Anomaly: {item.anomalyRatio}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </aside>
  );
}
