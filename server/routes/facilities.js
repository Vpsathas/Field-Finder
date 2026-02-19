import { Router } from 'express';
import {
  getAllFacilities,
  getFacilityById,
  addFacility,
  computeStatus,
  getSport,
  isStore,
} from '../store.js';
import { groupFacilities } from '../groupFacilities.js';

export const facilitiesRouter = Router();

facilitiesRouter.get('/', (req, res) => {
  const sport = req.query.sport;
  const flat = req.query.flat === 'true';
  let list = getAllFacilities()
    .filter((f) => !isStore(f.name))
    .map((f) => {
      const computedSport = getSport(f);
      return {
        ...f,
        sport: f.sport ?? computedSport,
        computedSport,
        computedStatus: computeStatus(f),
      };
    });
  if (sport) list = list.filter((f) => (f.computedSport || f.sport) === sport);
  if (flat) {
    res.json(list);
    return;
  }
  const items = groupFacilities(list);
  res.json(items);
});

facilitiesRouter.get('/:id', (req, res) => {
  const f = getFacilityById(req.params.id);
  if (!f || isStore(f.name)) return res.status(404).json({ error: 'Not found' });
  const computedSport = getSport(f);
  res.json({
    ...f,
    sport: f.sport ?? computedSport,
    computedSport,
    computedStatus: computeStatus(f),
  });
});

facilitiesRouter.post('/', (req, res) => {
  const { name, type, sport, lat, lng, openingHours, externalUrl, webcamUrl } = req.body;
  if (lat == null || lng == null) {
    return res.status(400).json({ error: 'lat and lng required' });
  }
  const created = addFacility({
    name,
    type,
    sport,
    lat,
    lng,
    openingHours,
    externalUrl,
    webcamUrl,
  });
  res.status(201).json(created);
});
