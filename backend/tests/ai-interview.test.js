const request = require('supertest');
const app = require('../server');

describe('AI Interview API Tests', () => {
  let authToken;
  let testApplicationId;
  let testInterviewId;

  beforeAll(async () => {
    // Login to get auth token (assuming test user exists)
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
    }

    // Create a test application if needed
    if (authToken) {
      const appResponse = await request(app)
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          job: '507f1f77bcf86cd799439011', // Test job ID
          resume: '507f1f77bcf86cd799439012', // Test resume ID
          coverLetter: 'Test cover letter'
        });

      if (appResponse.status === 201) {
        testApplicationId = appResponse.body.data._id;
      }
    }
  });

  describe('POST /api/v1/applications/:id/ai-interview', () => {
    it('should schedule AI interview successfully', async () => {
      if (!authToken || !testApplicationId) {
        console.log('Skipping test - no auth token or application ID');
        return;
      }

      const response = await request(app)
        .post(`/api/v1/applications/${testApplicationId}/ai-interview`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration: 30,
          notes: 'Test AI interview scheduling'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('interviewId');
      expect(response.body.data).toHaveProperty('uniqueLink');
      expect(response.body.data.questions).toBeGreaterThan(0);

      testInterviewId = response.body.data.interviewId;
    });

    it('should return 400 for invalid duration', async () => {
      if (!authToken || !testApplicationId) return;

      const response = await request(app)
        .post(`/api/v1/applications/${testApplicationId}/ai-interview`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          duration: 200, // Invalid duration > 120
          notes: 'Test invalid duration'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/applications/:id/ai-interview-link', () => {
    it('should get AI interview link successfully', async () => {
      if (!authToken || !testApplicationId) return;

      const response = await request(app)
        .get(`/api/v1/applications/${testApplicationId}/ai-interview-link`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('uniqueLink');
      expect(response.body.data).toHaveProperty('expiresAt');
    });
  });

  describe('PUT /api/v1/applications/:id/ai-interview/:interviewId', () => {
    it('should update AI interview status successfully', async () => {
      if (!authToken || !testApplicationId || !testInterviewId) return;

      const response = await request(app)
        .put(`/api/v1/applications/${testApplicationId}/ai-interview/${testInterviewId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'completed',
          transcript: 'Test transcript from AI interview',
          vapiCallId: 'test-call-id',
          notes: 'Test completion notes'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/applications/public/ai-interview/:link', () => {
    it('should return 404 for invalid interview link', async () => {
      const response = await request(app)
        .get('/api/v1/applications/public/ai-interview/invalid-link');

      expect(response.status).toBe(404);
    });
  });
});
