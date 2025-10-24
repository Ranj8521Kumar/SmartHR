import { API_ENDPOINTS } from '../config/api';
import authService from './authService';

/**
 * Dashboard Service
 * Handles all dashboard-related API calls
 */

class DashboardService {
  /**
   * Get dashboard analytics
   * @returns {Promise} Dashboard data
   */
  async getDashboardAnalytics() {
    try {
      const token = authService.getToken();

      const response = await fetch(API_ENDPOINTS.ANALYTICS + '/dashboard', {
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
   * @param {Object} params - Query parameters
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
   * @param {Object} params - Query parameters
   * @returns {Promise} Job analytics data
   */
  async getJobAnalytics(params = {}) {
    try {
      const token = authService.getToken();
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.ANALYTICS}/jobs${queryString ? '?' + queryString : ''}`;

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
        throw new Error(data.message || 'Failed to fetch job analytics');
      }

      return data;
    } catch (error) {
      console.error('Job analytics error:', error);
      throw error;
    }
  }

  /**
   * Get all jobs
   * @param {Object} params - Query parameters
   * @returns {Promise} Jobs list
   */
  async getJobs(params = {}) {
    try {
      const token = authService.getToken();
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.JOBS}${queryString ? '?' + queryString : ''}`;

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
        throw new Error(data.message || 'Failed to fetch jobs');
      }

      return data;
    } catch (error) {
      console.error('Get jobs error:', error);
      throw error;
    }
  }

  /**
   * Get all applications
   * @param {Object} params - Query parameters
   * @returns {Promise} Applications list
   */
  async getApplications(params = {}) {
    try {
      const token = authService.getToken();
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.APPLICATIONS}${queryString ? '?' + queryString : ''}`;

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
        throw new Error(data.message || 'Failed to fetch applications');
      }

      return data;
    } catch (error) {
      console.error('Get applications error:', error);
      throw error;
    }
  }

  /**
   * Get system logs
   * @param {Object} params - Query parameters
   * @returns {Promise} System logs
   */
  async getSystemLogs(params = {}) {
    try {
      const token = authService.getToken();
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.ANALYTICS}/logs${queryString ? '?' + queryString : ''}`;

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
        throw new Error(data.message || 'Failed to fetch system logs');
      }

      return data;
    } catch (error) {
      console.error('Get system logs error:', error);
      throw error;
    }
  }

  /**
   * Get manager dashboard analytics
   * @returns {Promise} Manager dashboard data
   */
  async getManagerDashboardAnalytics() {
    try {
      const token = authService.getToken();

      const response = await fetch(API_ENDPOINTS.ANALYTICS + '/manager-dashboard', {
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
}

// Export singleton instance
const dashboardService = new DashboardService();
export default dashboardService;
