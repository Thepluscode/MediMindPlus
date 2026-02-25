const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Health check for Railway
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Serve static files from the built output
app.use(express.static(path.join(__dirname, 'out')));

// SPA fallback — return index.html for all unmatched routes
app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'out', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web frontend serving on port ${PORT}`);
});
