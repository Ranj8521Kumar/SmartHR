const request = require('supertest');
const app = require('../server');

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('API Info', () => {
  it('should return API information', async () => {
    const response = await request(app).get('/api/v1');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.endpoints).toBeDefined();
  });
});
