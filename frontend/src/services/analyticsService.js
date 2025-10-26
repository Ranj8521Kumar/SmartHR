import { API_ENDPOINTS } from '../config/api';
import authService from './authService';

/**
 * Analytics Service
 * Handles all analytics-related API calls
 */

class AnalyticsService {
  /**
   * Get dashboard analytics
   * @returns {Promise} Dashboard analytics data
   */
  async getDashboardAnalytics() {
    try {
      const token = authService.getToken();

      const response = await fetch(`${API_ENDPOINTS.ANALYTICS}/dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch dashboard analytics');
      }

      return data;
    } catch (error) {
      console.error('Dashboard analytics error:', error);
      throw error;
    }
  }

  /**
   * Get application analytics
   * @param {Object} params - Query parameters (startDate, endDate, department)
   * @returns {Promise} Application analytics data
   */
  async getApplicationAnalytics(params = {}) {
    try {
      const token = authService.getToken();
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.ANALYTICS}/applications${queryString ? '?' + queryString : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch application analytics');
      }

      return data;
    } catch (error) {
      console.error('Application analytics error:', error);
      throw error;
    }
  }

  /**
   * Get job analytics
   * @returns {Promise} Job analytics data
   */
  async getJobAnalytics() {
    try {
      const token = authService.getToken();

      const response = await fetch(`${API_ENDPOINTS.ANALYTICS}/jobs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch job analytics');
      }

      return data;
    } catch (error) {
      console.error('Job analytics error:', error);
      throw error;
    }
  }

  /**
   * Get manager dashboard analytics
   * @returns {Promise} Manager dashboard analytics data
   */
  async getManagerDashboardAnalytics() {
    try {
      const token = authService.getToken();

      const response = await fetch(`${API_ENDPOINTS.ANALYTICS}/manager-dashboard`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch manager dashboard analytics');
      }

      return data;
    } catch (error) {
      console.error('Manager dashboard analytics error:', error);
      throw error;
    }
  }

  /**
   * Match candidates to a job using AI
   * @param {string} jobId - Job ID
   * @param {number} minScore - Minimum match score
   * @returns {Promise} Matched candidates
   */
  async matchCandidates(jobId, minScore = 0) {
    try {
      const token = authService.getToken();

      const response = await fetch(`${API_ENDPOINTS.ANALYTICS}/candidate-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ jobId, minScore }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to match candidates');
      }

      return data;
    } catch (error) {
      console.error('Candidate matching error:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
