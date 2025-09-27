const autocannon = require('autocannon');
const { spawn } = require('child_process');

describe('Load Testing', () => {
  let server;

  beforeAll(async () => {
    // Start server for testing
    server = spawn('npm', ['start'], {
      cwd: '../..',
      env: { ...process.env, NODE_ENV: 'test', PORT: '3001' },
      stdio: 'pipe'
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  afterAll(() => {
    if (server) {
      server.kill();
    }
  });

  it('should handle concurrent requests to health endpoint', async () => {
    const result = await autocannon({
      url: 'http://localhost:3001/health',
      connections: 10,
      pipelining: 1,
      duration: 10
    });

    expect(result.non2xx).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.requests.average).toBeGreaterThan(100); // At least 100 req/sec
  }, 30000);

  it('should handle authentication load', async () => {
    const result = await autocannon({
      url: 'http://localhost:3001/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      }),
      connections: 5,
      duration: 10
    });

    // Some requests will fail due to invalid credentials, but server should handle load
    expect(result.timeouts).toBe(0);
    expect(result.errors).toBe(0);
  }, 30000);
});
