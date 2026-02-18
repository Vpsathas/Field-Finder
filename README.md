# Sports Field Check

Check if sports fields, courts, and tracks are **open** or **in use** before you leave home. The app uses several mechanisms to determine status:

- **Opening hours** — When available (from seed data or OpenStreetMap), facilities are marked open/closed based on current time.
- **Crowdsourced reports** — Anyone can report “Open”, “Closed”, “In use”, or “Unknown”; the latest report is shown.
- **OpenStreetMap discovery** — Use “Discover nearby” to find and add facilities from OpenStreetMap (parks, pitches, sports centres) near your location.
- **External links** — Facilities can link to official pages or webcams so you can verify yourself.

Filter by **sport** (soccer, basketball, track and field, volleyball, football, tennis, baseball, softball, pickleball, other). The map uses **red pins** for every location and a **minimal CARTO light basemap** (no colored roads, trails, or train tracks).

*Satellite or live imagery to auto-detect “in use” would require paid/commercial APIs or on-site cameras; the app is built so you can attach webcam links and report status for now.*

## Run the app

```bash
npm install
npm run dev
```

- **Frontend:** http://localhost:3000  
- **API:** http://localhost:3001  

The Vite dev server proxies `/api` to the backend.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/facilities` | List facilities (optional `?sport=soccer\|basketball\|track_and_field\|volleyball\|football\|tennis\|baseball\|softball\|pickleball\|other`) |
| GET | `/api/facilities/:id` | Get one facility with computed status and sport |
| POST | `/api/facilities` | Add facility (body: name, type?, sport?, lat, lng, openingHours?, externalUrl?, webcamUrl?) |
| PUT | `/api/facilities/:id/status` | Report status (body: `{ "status": "open" \| "closed" \| "in_use" \| "unknown" }`) |
| GET | `/api/discovery/osm?lat=&lng=&radiusKm=` | Discover facilities from OpenStreetMap (adds to store) |

## Data

Facilities are stored in `server/data/facilities.json`. Seed data includes a few example facilities with opening hours. Discovery merges in new facilities from OSM without duplicating by location.

## Tech

- **Backend:** Node.js, Express, file-based JSON store  
- **Frontend:** Vanilla JS, Vite, Leaflet  
- **Map:** CARTO Light basemap; red pin markers  
- **Discovery:** Overpass API (OpenStreetMap) for sports amenities; sport inferred from OSM tags  
