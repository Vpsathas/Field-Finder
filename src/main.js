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

function renderList(items) {
  const ul = document.getElementById('facility-list');
  ul.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'facility-item';
    if (item.type === 'single') {
      const f = item.facility;
      const status = f.computedStatus || f.status || 'unknown';
      const sport = f.computedSport || f.sport || 'other';
      li.innerHTML = `
        <strong>${escapeHtml(f.name)}</strong>
        <span class="badge ${statusClass[status]}">${statusLabels[status]}</span>
        <span class="sport">${sportLabels[sport] || sport}</span>
      `;
      li.addEventListener('click', () => openModal(f));
    } else {
      const c = item;
      li.innerHTML = `
        <strong>${escapeHtml(c.name)}</strong>
        <span class="sport">${c.facilityCount} fields</span>
      `;
      li.addEventListener('click', () => openComplexModal(c));
    }
    ul.appendChild(li);
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function updateMap(items) {
  markersLayer.clearLayers();
  const pinIcon = getRedPinIcon();
  items.forEach((item) => {
    if (item.type === 'single') {
      const f = item.facility;
      const marker = L.marker([f.lat, f.lng], { icon: pinIcon })
        .on('click', () => openModal(f));
      marker.facility = f;
      markersLayer.addLayer(marker);
    } else {
      const c = item;
      const marker = L.marker([c.lat, c.lng], { icon: pinIcon })
        .on('click', () => openComplexModal(c));
      marker.complex = c;
      markersLayer.addLayer(marker);
    }
  });
}

function showSingleModal() {
  document.getElementById('modal-single').classList.remove('hidden');
  document.getElementById('modal-complex').classList.add('hidden');
}

function showComplexModal() {
  document.getElementById('modal-single').classList.add('hidden');
  document.getElementById('modal-complex').classList.remove('hidden');
}

function openModal(f) {
  const modal = document.getElementById('modal');
  showSingleModal();
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

function openComplexModal(complex) {
  const modal = document.getElementById('modal');
  showComplexModal();
  document.getElementById('modal-complex-title').textContent = complex.name;
  const listEl = document.getElementById('modal-complex-list');
  listEl.innerHTML = '';
  complex.facilities.forEach((f) => {
    const status = f.computedStatus || f.status || 'unknown';
    const sport = f.computedSport || f.sport || 'other';
    const li = document.createElement('li');
    li.className = 'modal-complex-item';
    li.innerHTML = `
      <strong>${escapeHtml(f.name)}</strong>
      <span class="badge ${statusClass[status]}">${statusLabels[status]}</span>
      <span class="sport">${sportLabels[sport] || sport}</span>
    `;
    li.addEventListener('click', () => {
      openModal(f);
    });
    listEl.appendChild(li);
  });
  modal.dataset.facilityId = '';
  modal.classList.remove('hidden');
}

function reportStatus(id, status) {
  fetch(`${API}/facilities/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
    .then((r) => r.json())
    .then((updated) => {
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
  map = L.map('map').setView([30.2672, -97.7431], 12);
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
        fetch(`${API}/discovery/osm?lat=${latitude}&lng=${longitude}&radiusKm=5`)
          .then((r) => {
            if (!r.ok) throw new Error(r.status === 502 ? 'Map data service unavailable. Try again in a moment.' : 'Discovery failed.');
            return r.json();
          })
          .then((data) => {
            btn.disabled = false;
            btn.textContent = 'Discover nearby';
            document.getElementById('filter-sport').value = '';
            refresh();
            map.flyTo([latitude, longitude], 14, { duration: 0.8 });
            const n = data.discovered != null ? data.discovered : 0;
            if (n > 0) alert(`Added ${n} facilities. Map updated.`);
            else alert('No new facilities in this area. Showing existing pins.');
          })
          .catch((err) => {
            btn.disabled = false;
            btn.textContent = 'Discover nearby';
            alert(err.message || 'Discovery failed. Try again.');
          });
      },
      () => {
        btn.disabled = false;
        btn.textContent = 'Discover nearby';
        alert('Could not get your location. Allow location access and try again.');
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
