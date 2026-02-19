/**
 * Group facilities that are within a short distance into "complexes".
 * Uses haversine distance and union-find so that transitively close facilities form one group.
 * - Same building / adjacent courts: 100m radius.
 * - Golf: 1.5km radius so a whole course (all holes) becomes one pin.
 */

const RADIUS_BUILDING_M = 100;   // same building / adjacent courts
const RADIUS_GOLF_COURSE_M = 1500; // whole golf course → one pin
const EARTH_RADIUS_M = 6_371_000;

function haversineM(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_M * c;
}

function getSport(f) {
  return (f.computedSport || f.sport || '').toLowerCase();
}

function getMergeRadiusM(a, b) {
  const sa = getSport(a);
  const sb = getSport(b);
  if (sa === 'golf' && sb === 'golf') return RADIUS_GOLF_COURSE_M;
  return RADIUS_BUILDING_M;
}

function find(parent, i) {
  if (parent[i] !== i) parent[i] = find(parent, parent[i]);
  return parent[i];
}

function union(parent, rank, i, j) {
  const pi = find(parent, i);
  const pj = find(parent, j);
  if (pi === pj) return;
  if (rank[pi] < rank[pj]) parent[pi] = pj;
  else if (rank[pi] > rank[pj]) parent[pj] = pi;
  else {
    parent[pj] = pi;
    rank[pi] += 1;
  }
}

/**
 * @param {Array<{ id: string, lat: number, lng: number, name?: string, [k: string]: any }>} facilities
 * @returns {Array<{ type: 'single', facility: any } | { type: 'complex', id: string, name: string, lat: number, lng: number, facilityCount: number, facilities: any[] }>}
 */
export function groupFacilities(facilities) {
  if (!facilities.length) return [];

  const n = facilities.length;
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = facilities[i];
      const b = facilities[j];
      const d = haversineM(a.lat, a.lng, b.lat, b.lng);
      const radius = getMergeRadiusM(a, b);
      if (d <= radius) union(parent, rank, i, j);
    }
  }

  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const root = find(parent, i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root).push(facilities[i]);
  }

  const items = [];
  for (const [, group] of groups) {
    if (group.length === 1) {
      items.push({ type: 'single', facility: group[0] });
    } else {
      const lat = group.reduce((s, f) => s + f.lat, 0) / group.length;
      const lng = group.reduce((s, f) => s + f.lng, 0) / group.length;
      const firstName = group[0].name || 'Area';
      const name = group.every((f) => (f.name || '').trim() === (firstName || '').trim())
        ? `${firstName.trim() || 'Area'} (${group.length} fields)`
        : `${firstName.trim() || 'Area'} and area (${group.length} fields)`;
      items.push({
        type: 'complex',
        id: `complex-${group[0].id}`,
        name,
        lat,
        lng,
        facilityCount: group.length,
        facilities: group,
      });
    }
  }
  return items;
}
