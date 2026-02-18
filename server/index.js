import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { facilitiesRouter } from './routes/facilities.js';
import { statusRouter } from './routes/status.js';
import { discoveryRouter } from './routes/discovery.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/facilities', facilitiesRouter);
app.use('/api/facilities', statusRouter);
app.use('/api/discovery', discoveryRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

// In production, serve the built frontend from dist/
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
