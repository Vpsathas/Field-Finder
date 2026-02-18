import { Router } from 'express';
import { getFacilityById, updateFacilityStatus, computeStatus } from '../store.js';

export const statusRouter = Router();

statusRouter.put('/:id/status', (req, res) => {
  const { status } = req.body;
  const valid = ['open', 'closed', 'in_use', 'unknown'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'status must be one of: ' + valid.join(', ') });
  }
  const updated = updateFacilityStatus(req.params.id, status, 'crowdsourced');
  if (!updated) return res.status(404).json({ error: 'Facility not found' });
  res.json({ ...updated, computedStatus: computeStatus(updated) });
});
