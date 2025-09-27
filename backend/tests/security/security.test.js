const request = require('supertest');
const app = require('../../../src/server');

// Helper function to generate malicious SQL injection payloads
const sqlInjectionPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1' OR 1=1 --",
  "1' UNION SELECT username, password FROM users --"
];

// Helper function to generate XSS payloads
const xssPayloads = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '"onmouseover="alert(1)',
  'javascript:alert(1)'
];

describe('Security Tests', () => {
  describe('SQL Injection Protection', () => {
    it('should sanitize user input in login endpoint', async () => {
      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'password123'
          });

        // Should return 400 or 401, not 500 (server error)
        expect([400, 401]).toContain(response.status);
      }
    });
  });

  describe('XSS Protection', () => {
    it('should sanitize user input in registration', async () => {
      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            firstName: payload,
            lastName: 'Test'
          });

        // Should either reject or sanitize the input
        if (response.status === 201) {
          // If registration succeeds, check if input was sanitized
          expect(response.body.user.firstName).not.toContain('<script>');
          expect(response.body.user.firstName).not.toContain('javascript:');
        } else {
          // Or reject with 400
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      const testEmail = `ratelimit${Date.now()}@example.com`;
      
      // Make more requests than the rate limit allows
      const requests = Array(10).fill().map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: testEmail,
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // At least some requests should be rate limited
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('CORS Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app).options('/api/health');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=');
      expect(response.headers['content-security-policy']).toBeDefined();
    });
  });
});
