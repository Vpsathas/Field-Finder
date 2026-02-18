import { Router } from 'express';
import { getAllFacilities, addFacility, SPORTS } from '../store.js';

function osmSportToAppSport(osmSport) {
  if (!osmSport) return 'other';
  const first = String(osmSport).split(';')[0].trim();
  const s = first.toLowerCase().replace(/-/g, '_');
  if (s === 'soccer') return 'soccer';
  if (s === 'basketball') return 'basketball';
  if (s === 'tennis') return 'tennis';
  if (s === 'volleyball' || s === 'beachvolleyball') return 'volleyball';
  if (s === 'american_football' || s === 'football') return 'football';
  if (s === 'baseball') return 'baseball';
  if (s === 'softball') return 'softball';
  if (s === 'athletics' || s === 'running') return 'track_and_field';
  if (s === 'pickleball') return 'pickleball';
  return SPORTS.includes(s) ? s : 'other';
}

export const discoveryRouter = Router();

/**
 * Discover sports facilities from OpenStreetMap (Overpass API) for a bounding box.
 * Optional: ?lat=40.7&lng=-74&radiusKm=5
 */
discoveryRouter.get('/osm', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radiusKm = Math.min(parseFloat(req.query.radiusKm) || 5, 10);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return res.status(400).json({ error: 'lat and lng query params required' });
  }

  const radiusM = radiusKm * 1000;
  const delta = radiusM / 111320;
  const minLat = lat - delta;
  const maxLat = lat + delta;
  const minLng = lng - delta / Math.cos((lat * Math.PI) / 180);
  const maxLng = lng + delta / Math.cos((lat * Math.PI) / 180);

  const bbox = [minLat, minLng, maxLat, maxLng].join(',');
  const query = `
    [out:json][timeout:15];
    (
      node["leisure"="pitch"](${bbox});
      node["leisure"="sports_centre"](${bbox});
      node["sport"](${bbox});
      way["leisure"="pitch"](${bbox});
      way["leisure"="sports_centre"](${bbox});
    );
    out center;
  `;

  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Overpass API error ${r.status}: ${text.slice(0, 100)}`);
    }
    const data = await r.json();
    const existing = getAllFacilities();
    const existingKeys = new Set(existing.map((f) => `${f.lat.toFixed(5)}-${f.lng.toFixed(5)}`));

    const seen = new Set();
    const newOnes = [];
    for (const el of data.elements || []) {
      const latEl = el.lat ?? el.center?.lat;
      const lonEl = el.lon ?? el.lng ?? el.center?.lon;
      if (latEl == null || lonEl == null) continue;
      const key = `${Number(latEl).toFixed(5)}-${Number(lonEl).toFixed(5)}`;
      if (existingKeys.has(key) || seen.has(key)) continue;
      seen.add(key);
      const rawSport = el.tags?.sport;
      const sport = osmSportToAppSport(rawSport);
      const name = el.tags?.name || (typeof rawSport === 'string' ? rawSport.replace(/_/g, ' ') : 'Sports facility');
      const created = addFacility({
        name,
        type: 'field',
        sport,
        lat: latEl,
        lng: lonEl,
        openingHours: el.tags?.opening_hours ? parseOpeningHours(el.tags.opening_hours) : null,
      });
      newOnes.push(created);
    }
    res.json({ discovered: newOnes.length, facilities: newOnes });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Discovery request failed', message: err.message });
  }
});

function parseOpeningHours(oh) {
  try {
    const dayMap = { Mo: 'mon', Tu: 'tue', We: 'wed', Th: 'thu', Fr: 'fri', Sa: 'sat', Su: 'sun' };
    const result = { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };
    const parts = oh.split(';').map((s) => s.trim());
    for (const part of parts) {
      const [days, time] = part.split(/\s+/);
      const range = time && time.includes('-') ? time.split('-').map((t) => t.trim()) : null;
      if (!range || range.length !== 2) continue;
      const daysMatch = days.match(/([A-Za-z]{2})-?([A-Za-z]{2})?/);
      if (daysMatch) {
        const d1 = dayMap[daysMatch[1]] || daysMatch[1].toLowerCase().slice(0, 3);
        const d2 = daysMatch[2] ? (dayMap[daysMatch[2]] || daysMatch[2].toLowerCase().slice(0, 3)) : d1;
        const order = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        let i = order.indexOf(d1);
        const j = order.indexOf(d2);
        if (i === -1) i = 0;
        const end = j >= 0 ? j : order.indexOf(d1);
        for (let k = i; k <= (end >= i ? end : 6); k++) {
          const d = order[k];
          if (result[d]) result[d].push([range[0], range[1]]);
        }
      }
    }
    return result;
  } catch {
    return null;
  }
}
