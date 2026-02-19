import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, 'data', 'facilities.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(DATA_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function save(facilities) {
  ensureDataDir();
  fs.writeFileSync(DATA_PATH, JSON.stringify(facilities, null, 2), 'utf8');
}

let facilities = load();

export function getAllFacilities() {
  return [...facilities];
}

export function getFacilityById(id) {
  return facilities.find((f) => f.id === id) ?? null;
}

/** Normalized sports for filtering. */
export const SPORTS = [
  'soccer', 'basketball', 'track_and_field', 'volleyball', 'football',
  'tennis', 'baseball', 'softball', 'pickleball', 'golf', 'other'
];

/** True if the facility name suggests a store/shop/retail rather than a field or court. */
export function isStore(name) {
  if (!name || typeof name !== 'string') return false;
  const n = name.toLowerCase().trim();
  if (!n) return true;
  if (/\bshop\b|\bstore\b|\bretail\b|\boutlet\b|\bwear\b|\bapparel\b/.test(n)) return true;
  if (/\bpilates\b|\bbarre\b|\bskate\s*shop\b|\bfleet\s*feet\b/.test(n)) return true;
  if (/\byoga\b/.test(n) && !/\b(park|centre|center|field|complex)\b/.test(n)) return true;
  if (/\bchess\b/.test(n)) return true;
  if (/^(fitness|yoga|chess)$/.test(n)) return true;
  return false;
}

function inferSport(f) {
  if (f.sport && SPORTS.includes(f.sport)) return f.sport;
  if (f.type === 'track') return 'track_and_field';
  const n = (f.name || '').toLowerCase();
  if (n.includes('soccer') || n === 'soccer') return 'soccer';
  if (n.includes('basketball') || n === 'basketball') return 'basketball';
  if (n.includes('tennis') && !n.includes('table_tennis') && !n.includes('pickleball')) return 'tennis';
  if (n.includes('volleyball') || n.includes('beachvolleyball')) return 'volleyball';
  if (n.includes('football') || n.includes('american_football')) return 'football';
  if (n.includes('baseball') || n === 'baseball') return 'baseball';
  if (n.includes('softball') || n === 'softball') return 'softball';
  if (n.includes('athletics') || n.includes('running') || n.includes('track')) return 'track_and_field';
  if (n.includes('pickleball')) return 'pickleball';
  if (n.includes('golf')) return 'golf';
  if (f.type === 'court' || f.type === 'field') return 'other';
  return 'other';
}

export function getSport(facility) {
  return inferSport(facility);
}

export function addFacility(facility) {
  const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
  const sport = facility.sport && SPORTS.includes(facility.sport) ? facility.sport : inferSport({ ...facility, name: facility.name || '', type: facility.type });
  const created = {
    id,
    name: facility.name || 'Unnamed',
    type: facility.type || 'field',
    sport,
    lat: Number(facility.lat),
    lng: Number(facility.lng),
    openingHours: facility.openingHours || null,
    externalUrl: facility.externalUrl || null,
    webcamUrl: facility.webcamUrl || null,
    status: null,
    statusUpdatedAt: null,
    statusSource: null,
    createdAt: new Date().toISOString(),
  };
  facilities.push(created);
  save(facilities);
  return created;
}

export function updateFacilityStatus(id, status, source = 'crowdsourced') {
  const f = facilities.find((x) => x.id === id);
  if (!f) return null;
  f.status = status;
  f.statusUpdatedAt = new Date().toISOString();
  f.statusSource = source;
  save(facilities);
  return f;
}

export function computeStatus(facility) {
  const now = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayNames[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (facility.status && facility.statusSource === 'crowdsourced' && facility.statusUpdatedAt) {
    const updated = new Date(facility.statusUpdatedAt);
    const hoursSince = (now - updated) / (1000 * 60 * 60);
    if (hoursSince < 24) return facility.status;
  }

  const hours = facility.openingHours;
  if (!hours || !hours[today]) return facility.status ?? 'unknown';

  const ranges = hours[today];
  if (!Array.isArray(ranges) || ranges.length === 0) return facility.status ?? 'unknown';

  for (const [open, close] of ranges) {
    const [oH, oM] = open.split(':').map(Number);
    const [cH, cM] = close.split(':').map(Number);
    const openM = oH * 60 + oM;
    const closeM = cH * 60 + cM;
    if (currentMinutes >= openM && currentMinutes <= closeM) return 'open';
  }
  return 'closed';
}

export function setFacilities(data) {
  facilities = data;
  save(facilities);
}
