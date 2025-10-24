import { API_ENDPOINTS } from '../config/api';
import authService from './authService';

/**
 * User Service
 * Handles all user-related API calls
 */

class UserService {
  /**
   * Get all users
   * @param {Object} params - Query parameters
   * @returns {Promise} Users data
   */
  async getUsers(params = {}) {
    try {
      const token = authService.getToken();
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_ENDPOINTS.USERS}${queryString ? '?' + queryString : ''}`;

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
        throw new Error(data.message || 'Failed to fetch users');
      }

      return data;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  /**
   * Get single user
   * @param {string} userId - User ID
   * @returns {Promise} User data
   */
  async getUser(userId) {
    try {
      const token = authService.getToken();

      const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      return data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Create user
   * @param {Object} userData - User data
   * @returns {Promise} Created user data
   */
  async createUser(userData) {
    try {
      const token = authService.getToken();

      const response = await fetch(API_ENDPOINTS.USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create user');
      }

      return data;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise} Updated user data
   */
  async updateUser(userId, userData) {
    try {
      const token = authService.getToken();

      const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      return data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {Promise} Response data
   */
  async deleteUser(userId) {
    try {
      const token = authService.getToken();

      const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      return data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  /**
   * Update current user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} Updated user data
   */
  async updateProfile(profileData) {
    try {
      const token = authService.getToken();

      const response = await fetch(API_ENDPOINTS.UPDATE_DETAILS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change password
   * @param {Object} passwordData - Current and new password
   * @returns {Promise} Response data
   */
  async changePassword(passwordData) {
    try {
      const token = authService.getToken();

      const response = await fetch(API_ENDPOINTS.UPDATE_PASSWORD, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
        body: JSON.stringify(passwordData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      return data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}

export default new UserService();
