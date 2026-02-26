import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use(express.static(join(__dirname, 'out')));
app.get('*', (_, res) => {
  res.sendFile(join(__dirname, 'out', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web frontend serving on port ${PORT}`);
});
