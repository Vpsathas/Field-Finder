import express from 'express';
import cors from 'cors';
import { facilitiesRouter } from './routes/facilities.js';
import { statusRouter } from './routes/status.js';
import { discoveryRouter } from './routes/discovery.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/facilities', facilitiesRouter);
app.use('/api/facilities', statusRouter);
app.use('/api/discovery', discoveryRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
