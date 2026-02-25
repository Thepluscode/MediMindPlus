// Minimal startup script that starts the HTTP server and serves /health
// Used to diagnose Railway deployment issues
const http = require('http');
const { execSync } = require('child_process');

console.log('=== MediMindPlus Startup Diagnostics ===');
console.log('Node version:', process.version);
console.log('Working dir:', process.cwd());
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);
console.log('ENCRYPTION_KEY exists:', !!process.env.ENCRYPTION_KEY);

// Check if dist/index.js exists
try {
  require.resolve('./dist/index.js');
  console.log('dist/index.js: EXISTS');
} catch (e) {
  console.log('dist/index.js: NOT FOUND -', e.message);
}

// Start a minimal health server first
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Diagnostics mode' }));
  } else {
    res.writeHead(200);
    res.end('MediMindPlus starting...');
  }
});

server.listen(PORT, () => {
  console.log(`Diagnostics server listening on port ${PORT}`);

  // Now try to load the actual app
  console.log('Attempting to load main application...');
  try {
    require('./dist/index.js');
    console.log('Main app loaded successfully');
  } catch (e) {
    console.error('Main app failed to load:', e.message);
    console.error(e.stack);
  }
});
