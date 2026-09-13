import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, XCircle, RefreshCw, ShieldCheck, Info } from 'lucide-react';

export default function EvidenceLedger({ theme }) {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // true = valid, false = tampered

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/ledger');
      const data = await res.json();
      setLedger(data);
      setVerificationResult(null); // Reset validation state on fetch
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const verifyChain = async () => {
    setVerifying(true);
    try {
      const res = await fetch('http://localhost:5000/api/ledger/verify', { method: 'POST' });
      const data = await res.json();
      setVerificationResult(data.isValid);
      setLedger(data.ledger); // Update UI with flagged tampered blocks if any
    } catch (err) {
      console.error('Verification failed', err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Verification Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={24} color="var(--accent-primary)" />
            Evidence Integrity Ledger
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <Info size={14} /> Simulated evidence integrity chain demonstrating blockchain-based tamper detection concept.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={fetchLedger} className="btn-secondary" style={{ padding: '10px 16px' }}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
          </button>
          
          <button onClick={verifyChain} className="btn-primary" disabled={verifying} style={{ padding: '10px 20px' }}>
            {verifying ? <RefreshCw size={16} className="spin" /> : <ShieldCheck size={16} />}
            {verifying ? 'Verifying Chain...' : 'Verify Integrity'}
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {verificationResult !== null && (
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '700',
          background: verificationResult ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${verificationResult ? '#10b981' : '#ef4444'}`,
          color: verificationResult ? '#10b981' : '#ef4444'
        }}>
          {verificationResult ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
          {verificationResult 
            ? 'VERIFIED: No tampering detected. Cryptographic hash chain is fully intact.' 
            : 'TAMPER DETECTED: Hash mismatch found in the chain! Evidence has been altered.'}
        </div>
      )}

      {/* Ledger Table */}
      <div className="tactical-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-dim)' }}>Block ID</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-dim)' }}>Timestamp</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-dim)' }}>Source Report</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-dim)' }}>Block Hash (SHA-256)</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-dim)' }}>Previous Hash</th>
              <th style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--text-dim)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((block) => (
              <tr key={block.id} style={{ 
                borderBottom: '1px solid var(--border-color)', 
                background: block.status === 'tampered' ? 'rgba(239, 68, 68, 0.05)' : 'transparent' 
              }}>
                <td style={{ padding: '16px', fontWeight: '800' }}>#{block.id}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(block.timestamp).toLocaleString()}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    background: 'var(--bg-card-hover)', 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    border: '1px solid var(--border-color)' 
                  }}>
                    {block.reportId}
                  </span>
                </td>
                <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px', color: block.status === 'tampered' ? '#ef4444' : 'var(--accent-primary)' }}>
                  {block.hash.substring(0, 16)}...
                </td>
                <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {block.previousHash.substring(0, 16)}...
                </td>
                <td style={{ padding: '16px' }}>
                  {block.status === 'verified' || block.status === undefined ? (
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                      <CheckCircle2 size={14} /> Valid
                    </span>
                  ) : (
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                      <XCircle size={14} /> Tampered
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {ledger.length === 0 && !loading && (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No evidence blocks recorded yet. Analyze a report to generate the genesis block.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
