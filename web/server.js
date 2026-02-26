import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Hashed assets (JS/CSS) — cache for 1 year (content-addressed, safe to cache forever)
app.use('/assets', express.static(join(__dirname, 'out', 'assets'), {
  maxAge: '1y',
  immutable: true,
}));

// index.html — never cache so browsers always get the latest chunk filenames
app.use(express.static(join(__dirname, 'out'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

app.get('*', (_, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(join(__dirname, 'out', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web frontend serving on port ${PORT}`);
});
