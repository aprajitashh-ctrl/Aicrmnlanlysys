import React, { useState } from 'react';
import { FileText, Cpu, CheckCircle2, AlertCircle, ArrowRight, Sparkles, RefreshCw, User, MapPin, Phone, Car, Building, Network } from 'lucide-react';

const PRESET_FIRS = [
  {
    title: 'FIR #402/2026 - Cyber Fraud & Hawala Syndicate',
    text: `CONFIDENTIAL POLICE REPORT - SPECIAL CRIME BRANCH
Station: Cyber Crime Police Station, Sector 18 Gurugram
FIR No: 402/2026 | Date: 02-Sept-2026

INCIDENT SUMMARY:
During investigation into a multi-crore phishing scam operating out of Sector 18 Cyber Hub - Gurugram, primary suspect Rahul Sharma was intercepted while conducting illegal Hawala fund transfers. Call detail record (CDR) analysis revealed that Rahul Sharma made multiple urgent encrypted phone calls to burner number +91-98765-43210.

Further intelligence confirmed +91-98765-43210 is controlled by kingpin Vikram Malhotra, who operates from Hotel Trident Suite 402 - Mumbai. Vikram Malhotra instructed co-accused Amit 'Chhota' Patel to dispatch a Black Fortuner (License Plate: MH-02-CZ-9988) loaded with illicit cash to Safehouse B - Panvel.

Financial tracing indicates Amit Patel transferred ₹45 Lakhs to Apex Shell Holdings, an offshore account managed by accountant Suresh Raina. SIM card supplier Priya Verma was found to have illegally activated 15 SIM cards, including +91-98765-43210 and +91-99887-76655.`
  },
  {
    title: 'FIR #889/2026 - Nhava Sheva Port Contraband Seizure',
    text: `SPECIAL INVESTIGATION TEAM (SIT) - DRUG ENFORCEMENT CELL
FIR No: 889/2026 | Location: Nhava Sheva Port, Navi Mumbai

DETAILS:
Customs officials intercepted a Container Truck (Registration: HR-26-DQ-4321) registered to front organization Shadow Logistics Pvt Ltd at Warehouse 14 - Nhava Sheva Port. Logistics manager Deepak Rao was arrested at the scene while trying to clear customs documents.

Deepak Rao admitted under interrogation that he received direct instructions from warehouse supervisor Sanjay Gupta and crypto broker Karan Johar. Rao made 8 incoming and outgoing calls to burner number +91-98765-43210 within 3 hours prior to seizure. DarkNet Pay Gateway was identified as the wallet service used to settle payments with kingpin Vikram Malhotra.`
  }
];

export default function AnalyzeFIR({ onAnalyzeComplete, onNavigateToGraph }) {
  const [firText, setFirText] = useState(PRESET_FIRS[0].text);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!firText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await onAnalyzeComplete(firText);
      setExtractedData(result.extractedData || result);
    } catch (err) {
      setError(err.message || 'Failed to extract entities from FIR report');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (presetText) => {
    setFirText(presetText);
    setExtractedData(null);
    setError(null);
  };

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      {/* Top Banner */}
      <div className="tactical-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={24} color="var(--accent-primary)" />
            AI FIR / Crime Report Text Analyzer
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Paste raw police reports or FIRs. Google Gemini AI will extract suspects, locations, phone numbers, vehicles, organizations, and relationships.
          </p>
        </div>

        {/* Preset Selectors */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {PRESET_FIRS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePresetSelect(preset.text)}
              className="btn-secondary"
              style={{ fontSize: '11px' }}
            >
              📋 Load Preset {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: extractedData ? '1fr 1fr' : '1fr', gap: '24px' }}>
        {/* Input Form Column */}
        <div className="tactical-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Input Police Report / FIR Document Text:
          </label>
          <textarea
            value={firText}
            onChange={(e) => setFirText(e.target.value)}
            placeholder="Paste raw police FIR report, transcript, or interrogation summary here..."
            rows={14}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              borderRadius: '8px',
              padding: '14px',
              color: 'var(--text-main)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              lineHeight: '1.6',
              resize: 'vertical',
              outline: 'none'
            }}
          />

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              color: '#f87171',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleAnalyze}
              disabled={loading || !firText.trim()}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '14px' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  Gemini AI Analyzing FIR...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Run Gemini AI Extraction
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extracted JSON & Preview Cards Column */}
        {extractedData && (
          <div className="tactical-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                Gemini AI Extracted Entities
              </h3>
              <button
                onClick={onNavigateToGraph}
                className="btn-primary"
                style={{ fontSize: '12px', padding: '6px 12px' }}
              >
                View on Graph <ArrowRight size={14} />
              </button>
            </div>

            {/* Extracted Category Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              
              {/* People */}
              {extractedData.people?.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <User size={12} /> PEOPLE ({extractedData.people.length}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {extractedData.people.map((p, i) => (
                      <span key={i} className="badge badge-person">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations */}
              {extractedData.locations?.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <MapPin size={12} /> LOCATIONS ({extractedData.locations.length}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {extractedData.locations.map((l, i) => (
                      <span key={i} className="badge badge-location">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Phone Numbers */}
              {extractedData.phoneNumbers?.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#f97316', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Phone size={12} /> PHONE NUMBERS ({extractedData.phoneNumbers.length}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {extractedData.phoneNumbers.map((ph, i) => (
                      <span key={i} className="badge badge-phone">{ph}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicles */}
              {extractedData.vehicles?.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Car size={12} /> VEHICLES ({extractedData.vehicles.length}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {extractedData.vehicles.map((v, i) => (
                      <span key={i} className="badge badge-vehicle">{v}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Organizations */}
              {extractedData.organizations?.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Building size={12} /> ORGANIZATIONS ({extractedData.organizations.length}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {extractedData.organizations.map((o, i) => (
                      <span key={i} className="badge badge-org">{o}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationships */}
              {extractedData.relationships?.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Network size={12} /> RELATIONSHIPS ({extractedData.relationships.length}):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {extractedData.relationships.map((rel, i) => (
                      <div key={i} style={{
                        fontSize: '11px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'var(--bg-main)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ color: 'var(--text-main)' }}>{rel.from}</span>
                        <span style={{ color: 'var(--accent-primary)', fontWeight: '700', fontSize: '10px' }}>⚡ {rel.type} ➔</span>
                        <span style={{ color: 'var(--text-main)' }}>{rel.to}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Raw JSON Accordion */}
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}>
                Show Raw Gemini JSON Response
              </summary>
              <pre style={{
                marginTop: '8px',
                padding: '10px',
                borderRadius: '6px',
                background: 'var(--bg-card-hover)',
                color: '#34d399',
                fontSize: '11px',
                maxHeight: '160px',
                overflowY: 'auto'
              }}>
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
