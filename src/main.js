import L from 'leaflet';

const API = '/api';
let map;
let markersLayer = L.layerGroup();
let facilities = [];

const statusLabels = {
  open: 'Open',
  closed: 'Closed',
  in_use: 'In use',
  unknown: 'Unknown',
};

const statusClass = {
  open: 'open',
  closed: 'closed',
  in_use: 'in_use',
  unknown: 'unknown',
};

const sportLabels = {
  soccer: 'Soccer',
  basketball: 'Basketball',
  track_and_field: 'Track and field',
  volleyball: 'Volleyball',
  football: 'Football',
  tennis: 'Tennis',
  baseball: 'Baseball',
  softball: 'Softball',
  pickleball: 'Pickleball',
  other: 'Other',
};

function getRedPinIcon() {
  return L.divIcon({
    className: 'marker-pin-wrap',
    html: '<span class="marker-pin-red"></span>',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
  });
}

async function fetchFacilities(sport = '') {
  const url = sport ? `${API}/facilities?sport=${encodeURIComponent(sport)}` : `${API}/facilities`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load facilities');
  return res.json();
}

function renderList(list) {
  const ul = document.getElementById('facility-list');
  ul.innerHTML = '';
  list.forEach((f) => {
    const status = f.computedStatus || f.status || 'unknown';
    const li = document.createElement('li');
    li.className = 'facility-item';
    const sport = f.computedSport || f.sport || 'other';
    li.innerHTML = `
      <strong>${escapeHtml(f.name)}</strong>
      <span class="badge ${statusClass[status]}">${statusLabels[status]}</span>
      <span class="sport">${sportLabels[sport] || sport}</span>
    `;
    li.dataset.id = f.id;
    li.addEventListener('click', () => openModal(f));
    ul.appendChild(li);
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function updateMap(list) {
  markersLayer.clearLayers();
  const pinIcon = getRedPinIcon();
  list.forEach((f) => {
    const marker = L.marker([f.lat, f.lng], { icon: pinIcon })
      .on('click', () => openModal(f));
    marker.facility = f;
    markersLayer.addLayer(marker);
  });
}

function openModal(f) {
  const modal = document.getElementById('modal');
  const status = f.computedStatus || f.status || 'unknown';
  document.getElementById('modal-title').textContent = f.name;
  document.getElementById('modal-status').innerHTML = `Status: <span class="badge ${statusClass[status]}">${statusLabels[status]}</span>`;
  document.getElementById('modal-hours').textContent = f.openingHours
    ? 'Opening hours are used to estimate open/closed when no recent report.'
    : 'No opening hours set. Report status to help others.';
  document.getElementById('modal-links').innerHTML = [
    f.externalUrl && `<a href="${f.externalUrl}" target="_blank" rel="noopener">Official page</a>`,
    f.webcamUrl && `<a href="${f.webcamUrl}" target="_blank" rel="noopener">Live view / webcam</a>`,
  ].filter(Boolean).join(' · ') || 'No links.';
  modal.dataset.facilityId = f.id;
  modal.classList.remove('hidden');
  document.querySelectorAll('.modal-content .status-buttons button').forEach((btn) => {
    btn.onclick = () => reportStatus(f.id, btn.dataset.status);
  });
}

function reportStatus(id, status) {
  fetch(`${API}/facilities/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
    .then((r) => r.json())
    .then((updated) => {
      const idx = facilities.findIndex((f) => f.id === id);
      if (idx >= 0) facilities[idx] = { ...facilities[idx], ...updated };
      const modal = document.getElementById('modal');
      if (modal.dataset.facilityId === id) {
        document.getElementById('modal-status').innerHTML = `Status: <span class="badge ${statusClass[updated.computedStatus]}">${statusLabels[updated.computedStatus]}</span>`;
      }
      refresh();
    })
    .catch(() => alert('Failed to report status'));
}

function refresh() {
  const sport = document.getElementById('filter-sport').value;
  fetchFacilities(sport).then((data) => {
    facilities = data;
    renderList(data);
    updateMap(data);
  });
}

function initMap() {
  map = L.map('map').setView([40.78, -73.97], 12);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map);
  markersLayer.addTo(map);
}

function init() {
  initMap();
  refresh();

  document.getElementById('filter-sport').addEventListener('change', refresh);

  document.getElementById('btn-discover').addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    const btn = document.getElementById('btn-discover');
    btn.disabled = true;
    btn.textContent = 'Searching…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetch(`${API}/discovery/osm?lat=${latitude}&lng=${longitude}&radiusKm=3`)
          .then((r) => r.json())
          .then((data) => {
            btn.disabled = false;
            btn.textContent = 'Discover nearby';
            refresh();
            if (data.discovered > 0) alert(`Added ${data.discovered} facilities from OpenStreetMap.`);
          })
          .catch(() => {
            btn.disabled = false;
            btn.textContent = 'Discover nearby';
            alert('Discovery failed. Try again.');
          });
      },
      () => {
        btn.disabled = false;
        btn.textContent = 'Discover nearby';
        alert('Could not get your location.');
      }
    );
  });

  document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
  });
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') e.target.classList.add('hidden');
  });
}

init();
