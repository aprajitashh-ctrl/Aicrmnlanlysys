/**
 * Geolocation Lookup Table for Indian Cities, Ports, Hubs, and FIR Locations
 */
export const LOCATION_COORDINATES = {
  // Mumbai Region
  'hotel trident suite 402 - mumbai': [18.9272, 72.8236],
  'hotel trident': [18.9272, 72.8236],
  'hotel oberoi': [18.9272, 72.8236],
  'mumbai': [18.9750, 72.8258],
  'warehouse 14 - nhava sheva port': [18.9500, 72.9500],
  'nhava sheva': [18.9500, 72.9500],
  'safehouse b - panvel': [18.9894, 73.1175],
  'panvel': [18.9894, 73.1175],
  'pune': [18.5204, 73.8567],

  // Delhi NCR Region
  'sector 18 cyber hub - gurugram': [28.4900, 77.0880],
  'cyber hub': [28.4900, 77.0880],
  'gurugram': [28.4900, 77.0880],
  'gurgon': [28.4900, 77.0880],
  'connaught place': [28.6315, 77.2167],
  'delhi': [28.6139, 77.2090],
  'noida': [28.5355, 77.3910],

  // Other Key Indian Hubs
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'kolkata': [22.5726, 88.3639],
  'hyderabad': [17.3850, 78.4867],
  'chennai': [13.0827, 80.2707],
  'ahmedabad': [23.0225, 72.5714]
};

/**
 * Resolve [lat, lng] for any node in the criminal network graph
 */
export function calculateNodeGeoPosition(node, graphData, indexMap = {}) {
  const nameLower = (node.name || node.id || '').toLowerCase();

  // 1. Direct Location Match
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    if (nameLower.includes(key)) {
      return coords;
    }
  }

  // If node is a Location but not in table, find keyword match (e.g. city names)
  if (node.type === 'Location') {
    if (nameLower.includes('mumbai') || nameLower.includes('port')) return [18.9600, 72.8500];
    if (nameLower.includes('delhi') || nameLower.includes('hub')) return [28.5500, 77.1500];
    // Fallback default for unmapped location
    return [19.0760 + ((indexMap[node.id] || 0) * 0.05), 72.8777 + ((indexMap[node.id] || 0) * 0.05)];
  }

  // 2. Non-Location Entity (Person, Phone, Vehicle, Org):
  // Find connected Location nodes
  const connectedLinks = (graphData.links || []).filter(l => {
    const srcId = typeof l.source === 'object' ? l.source.id : l.source;
    const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
    return srcId === node.id || tgtId === node.id;
  });

  const connectedLocationNode = connectedLinks.map(l => {
    const srcId = typeof l.source === 'object' ? l.source.id : l.source;
    const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
    const otherId = srcId === node.id ? tgtId : srcId;
    return (graphData.nodes || []).find(n => n.id === otherId && n.type === 'Location');
  }).find(Boolean);

  let basePos = [19.0760, 72.8777]; // Default Mumbai Base
  if (connectedLocationNode) {
    basePos = calculateNodeGeoPosition(connectedLocationNode, graphData, indexMap);
  }

  // Add polar angle offset around base location so entities cluster neatly without overlapping
  const idx = indexMap[node.id] || 1;
  const angle = (idx * 0.85);
  const radius = 0.015 + (idx * 0.005); // ~1.5 - 3 km spread
  
  const dLat = radius * Math.cos(angle);
  const dLng = radius * Math.sin(angle);

  return [basePos[0] + dLat, basePos[1] + dLng];
}
