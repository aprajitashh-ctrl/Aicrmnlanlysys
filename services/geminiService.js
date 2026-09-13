const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Clean and parse JSON response from Gemini model output
 */
function parseGeminiJSON(text) {
  try {
    // Remove markdown code block fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse Gemini output as JSON:', err.message, '\nRaw text:', text);
    throw new Error('Invalid JSON format returned from Gemini AI model');
  }
}

/**
 * Fallback Mock AI Entity Extractor for offline / missing API key mode
 */
function fallbackExtractEntities(text) {
  console.log('[GeminiService] Running smart fallback entity extraction on text...');
  const textLower = text.toLowerCase();
  
  // Extract Phone Numbers via Regex
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const rawPhones = text.match(phoneRegex) || [];
  const phoneNumbers = Array.from(new Set(rawPhones.map(p => p.trim())));

  // Extract Vehicles via Regex
  const vehicleRegex = /([A-Z]{2}[-\s]?\d{2}[-\s]?[A-Z]{1,2}[-\s]?\d{4})|(Fortuner|SUV|Truck|Swift|Sedan|Scorpio|Creta|Bolero)/gi;
  const rawVehicles = text.match(vehicleRegex) || [];
  const vehicles = Array.from(new Set(rawVehicles.map(v => v.trim())));

  // Heuristic People Extraction
  const people = [];
  const knownNames = [
    'Vikram Malhotra', 'Rahul Sharma', 'Amit Patel', 'Chhota Patel', 
    'Suresh Raina', 'Priya Verma', 'Deepak Rao', 'Karan Johar', 'Sanjay Gupta',
    'Rajesh Kumar', 'Vijay Mallya', 'Sameer Khan', 'Inspector Deshmukh'
  ];
  knownNames.forEach(name => {
    if (text.toLowerCase().includes(name.toLowerCase())) {
      people.push(name);
    }
  });

  // Capitalized phrase detection for additional names if none found
  if (people.length === 0) {
    const nameMatches = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g) || [];
    nameMatches.slice(0, 4).forEach(n => {
      if (!n.includes('Police') && !n.includes('Station') && !n.includes('Report') && !n.includes('Hotel')) {
        people.push(n);
      }
    });
  }

  // Locations
  const locations = [];
  const knownLocations = [
    'Warehouse 14', 'Nhava Sheva', 'Gurugram', 'Cyber Hub', 
    'Hotel Trident', 'Mumbai', 'Panvel', 'Safehouse B', 'Connaught Place', 'Delhi'
  ];
  knownLocations.forEach(loc => {
    if (text.toLowerCase().includes(loc.toLowerCase())) {
      locations.push(loc);
    }
  });

  // Organizations
  const organizations = [];
  const knownOrgs = ['Shadow Logistics', 'Apex Shell Holdings', 'DarkNet Gateway', 'State Police', 'Crime Branch'];
  knownOrgs.forEach(org => {
    if (text.toLowerCase().includes(org.toLowerCase())) {
      organizations.push(org);
    }
  });

  // Synthesize relationships
  const relationships = [];
  if (people.length >= 2) {
    relationships.push({ from: people[0], to: people[1], type: "CO_ACCUSED" });
  }
  if (people[0] && phoneNumbers[0]) {
    relationships.push({ from: people[0], to: phoneNumbers[0], type: "CALLED" });
  }
  if (people[0] && locations[0]) {
    relationships.push({ from: people[0], to: locations[0], type: "MET_AT" });
  }
  if (people[0] && vehicles[0]) {
    relationships.push({ from: people[0], to: vehicles[0], type: "OPERATED" });
  }
  if (people[1] && phoneNumbers[0]) {
    relationships.push({ from: people[1], to: phoneNumbers[0], type: "RECEIVED_CALL_FROM" });
  }

  return {
    people: Array.from(new Set(people)),
    locations: Array.from(new Set(locations)),
    phoneNumbers: Array.from(new Set(phoneNumbers)),
    vehicles: Array.from(new Set(vehicles)),
    organizations: Array.from(new Set(organizations)),
    relationships: relationships
  };
}

/**
 * Extract entities and relationships from crime report / FIR text using Gemini
 */
async function extractEntitiesFromFIR(text) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    console.warn('[GeminiService] GEMINI_API_KEY is not set. Using smart fallback extractor.');
    return fallbackExtractEntities(text);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert criminal intelligence analyst. Analyze the following FIR/Police report text and extract all entities and relationships between them.

CATEGORIES TO EXTRACT:
- people: Full names of individuals (suspects, accomplices, victims, informants)
- locations: Addresses, cities, landmarks, safehouses, hotel rooms, ports
- phoneNumbers: Phone numbers, mobile numbers, burner numbers
- vehicles: Vehicle license plate numbers, car models, trucks, getaways
- organizations: Gangs, front companies, banks, shell corporations, agencies
- relationships: Direct connections between entities (e.g., "met at", "called", "co-accused", "sent money to", "owned", "drove")

CRITICAL INSTRUCTIONS:
1. Return ONLY valid, parseable JSON without any prose, preamble, or markdown surrounding it (or use markdown \`\`\`json block).
2. The JSON structure MUST match this exact schema:
{
  "people": ["name1", "name2"],
  "locations": ["place1"],
  "phoneNumbers": ["number1"],
  "vehicles": ["vehicle1"],
  "organizations": ["org1"],
  "relationships": [
    { "from": "name1", "to": "name2", "type": "co-accused" },
    { "from": "name1", "to": "number1", "type": "called" }
  ]
}

FIR REPORT TEXT TO ANALYZE:
"""
${text}
"""
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return parseGeminiJSON(responseText);
  } catch (error) {
    console.error('[GeminiService] Gemini API call failed:', error.message);
    console.warn('[GeminiService] Falling back to smart offline entity extractor.');
    return fallbackExtractEntities(text);
  }
}

/**
 * Convert Natural Language question into a Neo4j Cypher query using Gemini
 */
async function convertQuestionToCypher(question) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    console.warn('[GeminiService] GEMINI_API_KEY not set for NL Search. Generating pattern match Cypher.');
    // Simple rule-based Cypher generation fallback
    const qLower = question.toLowerCase();
    const cleanWord = question.replace(/\b(who|is|connected|to|find|show|connections|all|relationships|of|for|the|with|about)\b|\?/gi, '').replace(/\s+/g, ' ').trim();
    
    if (qLower.includes('phone') || qLower.includes('number') || qLower.includes('call')) {
      return `MATCH (n)-[r]-(m) WHERE n:PhoneNumber OR m:PhoneNumber RETURN n, r, m LIMIT 25`;
    }
    if (cleanWord) {
      return `MATCH (n)-[r]-(m) WHERE toLower(n.name) CONTAINS toLower("${cleanWord}") OR toLower(m.name) CONTAINS toLower("${cleanWord}") RETURN n, r, m LIMIT 25`;
    }
    return `MATCH (n)-[r]-(m) RETURN n, r, m LIMIT 30`;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are a Cypher query expert for Neo4j. Convert the user's natural language question into a valid Cypher query.

Database Schema Labels:
- Person (properties: id, name, details)
- Location (properties: id, name, details)
- PhoneNumber (properties: id, name, details)
- Vehicle (properties: id, name, details)
- Organization (properties: id, name, details)

Relationships can be any direction: [r]

CRITICAL INSTRUCTIONS:
1. FIRST, identify and extract the core entity name from the user's question. Ignore instructional words like "show", "find", "who is connected to", "connections for".
   Example: "Show connections for Nhava Sheva" -> Extract "Nhava Sheva".
2. THEN, generate a Cypher query using ONLY that extracted entity name in a case-insensitive WHERE CONTAINS clause.
3. Return ONLY the final Cypher query text, with NO explanations or markdown formatting.
4. Ensure the query returns nodes n, relationships r, and connected nodes m, i.e., "RETURN n, r, m".

Question: "${question}"
`;

    const result = await model.generateContent(prompt);
    let cypher = result.response.text().trim();
    if (cypher.startsWith('```cypher')) {
      cypher = cypher.replace(/^```cypher\s*/i, '').replace(/\s*```$/, '');
    } else if (cypher.startsWith('```')) {
      cypher = cypher.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cypher;
  } catch (error) {
    console.error('[GeminiService] Text-to-Cypher failed:', error.message);
    const cleanWord = question.replace(/\b(who|is|connected|to|find|show|connections|all|relationships|of|for|the|with|about)\b|\?/gi, '').replace(/\s+/g, ' ').trim();
    return `MATCH (n)-[r]-(m) WHERE toLower(n.name) CONTAINS toLower("${cleanWord}") RETURN n, r, m LIMIT 25`;
  }
}

module.exports = {
  extractEntitiesFromFIR,
  convertQuestionToCypher
};
