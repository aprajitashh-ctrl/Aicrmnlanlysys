const neo4j = require('neo4j-driver');
const sampleData = require('../data/sampleData.json');

let driver = null;
let useInMemoryMode = true;

// In-Memory Graph Store for offline/fallback mode
const inMemoryGraph = {
  nodes: JSON.parse(JSON.stringify(sampleData.nodes)),
  links: JSON.parse(JSON.stringify(sampleData.links))
};

/**
 * Initialize Neo4j Driver Connection
 */
async function initNeo4j() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';

  // Check if default placeholders or dummy values are in use
  if (uri.includes('localhost:7687') || password === 'password' || uri === 'bolt://localhost:7687') {
    console.log('[Neo4jService] Standard/Placeholder Neo4j config detected. Checking local connection...');
  }

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      connectionTimeout: 3000,
      maxConnectionLifetime: 10000
    });
    
    await driver.verifyConnectivity();
    useInMemoryMode = false;
    console.log(`[Neo4jService] ✅ Successfully connected to Neo4j database at ${uri}`);
    await seedNeo4jIfEmpty();
  } catch (error) {
    console.warn(`[Neo4jService] ⚠️ Neo4j connection failed (${error.message}).`);
    console.log(`[Neo4jService] 🚀 Operating in IN-MEMORY GRAPH mode (Pre-loaded with sample criminal network dataset).`);
    useInMemoryMode = true;
  }
}

/**
 * Seed live Neo4j database with initial sample data if empty
 */
async function seedNeo4jIfEmpty() {
  if (useInMemoryMode || !driver) return;
  const session = driver.session();
  try {
    const result = await session.run('MATCH (n) RETURN count(n) as count');
    const count = result.records[0].get('count').toNumber();
    if (count === 0) {
      console.log('[Neo4jService] Database is empty. Seeding initial criminal network dataset into Neo4j...');
      for (const node of sampleData.nodes) {
        await session.run(
          `MERGE (n:${node.type} { id: $id }) SET n.name = $name, n.details = $details`,
          { id: node.id, name: node.name, details: node.details || '' }
        );
      }
      for (const link of sampleData.links) {
        const relType = (link.type || 'CONNECTED_TO').replace(/[^A-Z0-9_]/gi, '_').toUpperCase();
        await session.run(
          `MATCH (a { id: $source }), (b { id: $target }) 
           MERGE (a)-[r:${relType}]->(b) 
           SET r.type = $rawType`,
          { source: link.source, target: link.target, rawType: link.type }
        );
      }
      console.log('[Neo4jService] Seed complete.');
    }
  } catch (err) {
    console.error('[Neo4jService] Failed to seed Neo4j:', err.message);
  } finally {
    await session.close();
  }
}

/**
 * Get full graph data for visualization: { nodes, links }
 */
async function getGraphData() {
  if (useInMemoryMode || !driver) {
    // Add degree calculations to nodes
    const nodeDegreeMap = {};
    inMemoryGraph.nodes.forEach(n => { nodeDegreeMap[n.id] = 0; });
    inMemoryGraph.links.forEach(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      if (nodeDegreeMap[srcId] !== undefined) nodeDegreeMap[srcId]++;
      if (nodeDegreeMap[tgtId] !== undefined) nodeDegreeMap[tgtId]++;
    });

    const nodesWithDegree = inMemoryGraph.nodes.map(n => ({
      ...n,
      label: n.name,
      degree: nodeDegreeMap[n.id] || 0
    }));

    return {
      nodes: nodesWithDegree,
      links: inMemoryGraph.links.map(l => ({
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
        type: l.type || 'CONNECTED_TO'
      }))
    };
  }

  const session = driver.session();
  try {
    const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]-(m)
      WITH n, labels(n)[0] as type, count(r) as degree, collect(r) as rels
      RETURN n.id as id, n.name as name, n.details as details, type, degree
    `);

    const nodes = result.records.map(rec => ({
      id: rec.get('id'),
      name: rec.get('name'),
      label: rec.get('name'),
      details: rec.get('details') || '',
      type: rec.get('type') || 'Person',
      degree: rec.get('degree').toNumber()
    }));

    const linksResult = await session.run(`
      MATCH (a)-[r]->(b)
      RETURN a.id as source, b.id as target, type(r) as type
    `);

    const links = linksResult.records.map(rec => ({
      source: rec.get('source'),
      target: rec.get('target'),
      type: rec.get('type')
    }));

    return { nodes, links };
  } catch (error) {
    console.error('[Neo4jService] getGraphData error:', error.message);
    useInMemoryMode = true;
    return getGraphData();
  } finally {
    await session.close();
  }
}

/**
 * Save Extracted Data into Neo4j (or In-Memory)
 */
async function saveExtractedData(extractedData) {
  const { people = [], locations = [], phoneNumbers = [], vehicles = [], organizations = [], relationships = [] } = extractedData;

  const nodeCategoryMap = [
    { items: people, type: 'Person', prefix: 'p' },
    { items: locations, type: 'Location', prefix: 'l' },
    { items: phoneNumbers, type: 'PhoneNumber', prefix: 'ph' },
    { items: vehicles, type: 'Vehicle', prefix: 'v' },
    { items: organizations, type: 'Organization', prefix: 'o' }
  ];

  const nameToIdMap = {};

  if (useInMemoryMode || !driver) {
    // Save in memory
    nodeCategoryMap.forEach(({ items, type, prefix }) => {
      items.forEach((item, index) => {
        const itemName = typeof item === 'string' ? item : (item.name || item.id);
        if (!itemName) return;

        let existing = inMemoryGraph.nodes.find(n => n.name.toLowerCase() === itemName.toLowerCase());
        if (!existing) {
          const newId = `${prefix}_ext_${Date.now()}_${index}`;
          existing = {
            id: newId,
            name: itemName,
            type: type,
            details: `Extracted via Gemini AI Report Analysis`
          };
          inMemoryGraph.nodes.push(existing);
        }
        nameToIdMap[itemName.toLowerCase()] = existing.id;
      });
    });

    // Also populate existing nodes into nameToIdMap
    inMemoryGraph.nodes.forEach(n => {
      nameToIdMap[n.name.toLowerCase()] = n.id;
    });

    // Process relationships
    relationships.forEach(rel => {
      if (!rel.from || !rel.to) return;
      const fromId = nameToIdMap[rel.from.toLowerCase()] || rel.from;
      const toId = nameToIdMap[rel.to.toLowerCase()] || rel.to;

      const exists = inMemoryGraph.links.some(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source;
        const t = typeof l.target === 'object' ? l.target.id : l.target;
        return (s === fromId && t === toId) || (s === toId && t === fromId);
      });

      if (!exists && fromId && toId) {
        inMemoryGraph.links.push({
          source: fromId,
          target: toId,
          type: (rel.type || 'CONNECTED_TO').toUpperCase()
        });
      }
    });

    return { success: true, mode: 'in-memory', addedNodes: inMemoryGraph.nodes.length };
  }

  // Live Neo4j write
  const session = driver.session();
  try {
    // 1. Create / Merge Nodes
    for (const { items, type, prefix } of nodeCategoryMap) {
      for (let i = 0; i < items.length; i++) {
        const name = typeof items[i] === 'string' ? items[i] : (items[i].name || items[i].id);
        if (!name) continue;
        const safeId = `${prefix}_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;

        await session.run(
          `MERGE (n:${type} { name: $name }) 
           ON CREATE SET n.id = $id, n.details = 'Extracted from police FIR report'
           RETURN n.id as id`,
          { name, id: safeId }
        );
        nameToIdMap[name.toLowerCase()] = safeId;
      }
    }

    // 2. Create Relationships
    for (const rel of relationships) {
      if (!rel.from || !rel.to) continue;
      const relType = (rel.type || 'CONNECTED_TO').replace(/[^A-Z0-9_]/gi, '_').toUpperCase();

      await session.run(
        `MATCH (a), (b)
         WHERE toLower(a.name) = toLower($fromName) AND toLower(b.name) = toLower($toName)
         MERGE (a)-[r:${relType}]->(b)
         SET r.type = $typeText`,
        { fromName: rel.from, toName: rel.to, typeText: rel.type }
      );
    }

    return { success: true, mode: 'neo4j' };
  } catch (error) {
    console.error('[Neo4jService] saveExtractedData error:', error.message);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * GET /insights - Centrality / Degree Calculation for Top 10 Influencers
 */
async function getInsights() {
  const graph = await getGraphData();
  const sortedNodes = [...graph.nodes].sort((a, b) => b.degree - a.degree);
  const top10 = sortedNodes.slice(0, 10).map((n, idx) => ({
    rank: idx + 1,
    id: n.id,
    name: n.name,
    type: n.type,
    connections: n.degree,
    centralityScore: (n.degree / Math.max(1, graph.nodes.length - 1)).toFixed(2)
  }));

  return {
    totalEntities: graph.nodes.length,
    totalConnections: graph.links.length,
    topInfluencers: top10
  };
}

/**
 * GET /suspicious - Anomaly Detection for phone numbers or persons with >2x mean degree
 */
async function getSuspiciousPatterns() {
  const graph = await getGraphData();
  if (graph.nodes.length === 0) return { meanDegree: 0, suspiciousEntities: [] };

  const totalDegrees = graph.nodes.reduce((sum, n) => sum + n.degree, 0);
  const meanDegree = totalDegrees / graph.nodes.length;
  const threshold = 2 * meanDegree;

  const suspicious = graph.nodes
    .filter(n => n.degree > threshold || (n.type === 'PhoneNumber' && n.degree >= 3))
    .map(n => {
      const ratio = meanDegree > 0 ? (n.degree / meanDegree).toFixed(1) : n.degree;
      let reason = 'Multi-network Connection Hub';
      if (n.type === 'PhoneNumber') reason = 'High Call Frequency / Burner SIM Pattern';
      else if (n.type === 'Person') reason = 'Central Crime Syndicate Coordinator';
      else if (n.type === 'Vehicle') reason = 'Multi-Suspect Shared Getaway Asset';
      else if (n.type === 'Organization') reason = 'Frequent Cash Flow Front Entity';

      return {
        id: n.id,
        name: n.name,
        type: n.type,
        connections: n.degree,
        meanDegree: meanDegree.toFixed(1),
        anomalyRatio: `${ratio}x mean`,
        threatLevel: n.degree >= 5 ? 'CRITICAL' : 'HIGH',
        reason
      };
    })
    .sort((a, b) => b.connections - a.connections);

  return {
    meanDegree: meanDegree.toFixed(2),
    threshold: threshold.toFixed(2),
    suspiciousEntities: suspicious
  };
}

/**
 * POST /search - Filter graph by keyword or Cypher
 */
async function searchGraph(query) {
  const graph = await getGraphData();
  const qLower = query.toLowerCase();

  // Find matching node IDs
  const matchedNodes = graph.nodes.filter(n =>
    n.name.toLowerCase().includes(qLower) ||
    n.type.toLowerCase().includes(qLower) ||
    (n.details && n.details.toLowerCase().includes(qLower))
  );

  const matchedIds = new Set(matchedNodes.map(n => n.id));

  // Include 1-hop connected neighbors for context
  graph.links.forEach(l => {
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    const tgt = typeof l.target === 'object' ? l.target.id : l.target;
    if (matchedIds.has(src)) matchedIds.add(tgt);
    if (matchedIds.has(tgt)) matchedIds.add(src);
  });

  const filteredNodes = graph.nodes.filter(n => matchedIds.has(n.id));
  const filteredLinks = graph.links.filter(l => {
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    const tgt = typeof l.target === 'object' ? l.target.id : l.target;
    return matchedIds.has(src) && matchedIds.has(tgt);
  });

  return {
    nodes: filteredNodes,
    links: filteredLinks,
    query
  };
}

module.exports = {
  initNeo4j,
  getGraphData,
  saveExtractedData,
  getInsights,
  getSuspiciousPatterns,
  searchGraph
};
