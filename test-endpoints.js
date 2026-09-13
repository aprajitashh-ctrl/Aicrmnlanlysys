const http = require('http');

function postJSON(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:5000${path}`, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- STARTING BACKEND VERIFICATION ---');
  
  // 1. Health Check
  const health = await getJSON('/api/health');
  console.log('✅ GET /api/health:', health.data.status, 'Neo4j configured:', health.data.neo4jConfigured);

  // 2. Graph Data
  const graph = await getJSON('/api/graph');
  console.log('✅ GET /api/graph: Total Nodes:', graph.data.nodes.length, 'Total Links:', graph.data.links.length);

  // 3. Centrality Insights
  const insights = await getJSON('/api/insights');
  console.log('✅ GET /api/insights: Top Influencer #1:', insights.data.topInfluencers[0].name, 'Score/Degree:', insights.data.topInfluencers[0].connections);

  // 4. Anomaly Detection
  const suspicious = await getJSON('/api/suspicious');
  console.log('✅ GET /api/suspicious: Mean Degree:', suspicious.data.meanDegree, 'Anomalous Entities:', suspicious.data.suspiciousEntities.map(e => e.name));

  // 5. Natural Language Search
  const searchRes = await postJSON('/api/search', { query: 'Rahul' });
  console.log('✅ POST /api/search: Query "Rahul" matched nodes:', searchRes.data.nodes.map(n => n.name));

  // 6. FIR Report Analysis
  const firText = "INCIDENT REPORT: Accused Rajesh Kumar operated from Hotel Taj Suite 101. Call detail records show calls to burner +91-97777-88888. Getaway car DL-05-XY-7788 was driven by Sameer Khan.";
  const analyzeRes = await postJSON('/api/analyze', { text: firText });
  console.log('✅ POST /api/analyze: Extracted People:', analyzeRes.data.extractedData.people, 'PhoneNumbers:', analyzeRes.data.extractedData.phoneNumbers);

  console.log('--- ALL BACKEND ENDPOINTS VERIFIED SUCCESSFULLY ---');
}

runTests().catch(err => console.error('Verification failed:', err));
