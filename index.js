require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initNeo4j, getGraphData, saveExtractedData, getInsights, getSuspiciousPatterns, searchGraph } = require('./services/neo4jService');
const { extractEntitiesFromFIR, convertQuestionToCypher } = require('./services/geminiService');

const path = require('path');
const { getLedger, addBlock, verifyLedger } = require('./services/ledgerService');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend build if present
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));


// Initialize Neo4j Driver Connection
initNeo4j().catch(err => console.error('[Server] Neo4j init error:', err));

// Health Check
app.get(['/health', '/api/health'], (req, res) => {
  res.json({
    status: 'online',
    system: 'Criminal Network Analysis System Backend',
    timestamp: new Date().toISOString(),
    neo4jConfigured: !!process.env.NEO4J_URI,
    geminiConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  });
});

/**
 * 1. POST /analyze - Accepts text, calls Gemini AI to extract entities & relationships, saves to Neo4j
 */
app.post(['/analyze', '/api/analyze'], async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'FIR/Police report text is required' });
    }

    console.log(`[API] Received /analyze request (${text.length} chars)`);
    
    // Step 1: Extract entities using Gemini API
    const extractedData = await extractEntitiesFromFIR(text);

    // Step 2: Save extracted graph into Neo4j
    const saveResult = await saveExtractedData(extractedData);
    addBlock(`REP-${Date.now()}`, extractedData);

    // Step 3: Fetch updated full graph data
    const updatedGraph = await getGraphData();

    res.json({
      success: true,
      message: 'Entities extracted and criminal network updated in database',
      extractedData,
      saveResult,
      graph: updatedGraph
    });
  } catch (error) {
    console.error('[API] /analyze Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze text' });
  }
});

/**
 * 2. GET /graph - Returns all nodes & relationships from Neo4j formatted for force-graph
 */
app.get(['/graph', '/api/graph'], async (req, res) => {
  try {
    const graphData = await getGraphData();
    res.json(graphData);
  } catch (error) {
    console.error('[API] /graph Error:', error);
    res.status(500).json({ error: 'Failed to fetch graph data' });
  }
});

/**
 * 3. GET /insights - Centrality/degree calculation for top 10 Key Influencers
 */
app.get(['/insights', '/api/insights'], async (req, res) => {
  try {
    const insights = await getInsights();
    res.json(insights);
  } catch (error) {
    console.error('[API] /insights Error:', error);
    res.status(500).json({ error: 'Failed to calculate network insights' });
  }
});

/**
 * 4. GET /suspicious - Anomaly detection endpoint for entities with >2x mean degree
 */
app.get(['/suspicious', '/api/suspicious'], async (req, res) => {
  try {
    const suspiciousData = await getSuspiciousPatterns();
    res.json(suspiciousData);
  } catch (error) {
    console.error('[API] /suspicious Error:', error);
    res.status(500).json({ error: 'Failed to detect suspicious patterns' });
  }
});

/**
 * 5. POST /search - Accepts plain English question, converts to Cypher using Gemini, runs search query
 */
app.post(['/search', '/api/search'], async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`[API] Received /search request: "${query}"`);

    // Convert question to Cypher using Gemini
    const cypherQuery = await convertQuestionToCypher(query);
    console.log(`[API] Generated Cypher: ${cypherQuery}`);

    // Execute search filter
    const searchResult = await searchGraph(query);

    res.json({
      ...searchResult,
      cypherQuery
    });
  } catch (error) {
    console.error('[API] /search Error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// SPA Catch-all Route
// Evidence Ledger Endpoints
app.get('/api/ledger', (req, res) => {
  res.json(getLedger());
});

app.post('/api/ledger/verify', (req, res) => {
  const result = verifyLedger();
  res.json(result);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`
==================================================================
  🕵️  CRIMINAL NETWORK ANALYSIS SYSTEM - BACKEND SERVER
==================================================================
  Server Running at : http://localhost:${PORT}
  Health Check     : http://localhost:${PORT}/api/health
  Graph Endpoint   : http://localhost:${PORT}/api/graph
  Insights Endpoint: http://localhost:${PORT}/api/insights
  Suspicious Endpoint: http://localhost:${PORT}/api/suspicious
==================================================================
  `);
});


