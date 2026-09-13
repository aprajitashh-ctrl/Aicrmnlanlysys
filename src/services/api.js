const API_BASE = 'http://localhost:5000/api';

/**
 * Fetch full network graph nodes & links
 */
export async function fetchGraphData() {
  try {
    const res = await fetch(`${API_BASE}/graph`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('fetchGraphData error:', err);
    throw err;
  }
}

/**
 * Analyze police report text using Gemini AI
 */
export async function analyzeFIRText(text) {
  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('analyzeFIRText error:', err);
    throw err;
  }
}

/**
 * Fetch degree centrality / top 10 key influencers
 */
export async function fetchInsights() {
  try {
    const res = await fetch(`${API_BASE}/insights`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('fetchInsights error:', err);
    throw err;
  }
}

/**
 * Fetch anomaly detection suspicious patterns (>2x mean degree)
 */
export async function fetchSuspicious() {
  try {
    const res = await fetch(`${API_BASE}/suspicious`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('fetchSuspicious error:', err);
    throw err;
  }
}

/**
 * Natural language query search
 */
export async function searchNetwork(query) {
  try {
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('searchNetwork error:', err);
    throw err;
  }
}
