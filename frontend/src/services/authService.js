import { API_ENDPOINTS } from '../config/api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

class AuthService {
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} Response with token and user data
   */
  async login(email, password) {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend returns error in 'error' field, not 'message'
        throw new Error(data.error || data.message || 'Login failed');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Response with token and user data
   */
  async register(userData) {
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend returns error in 'error' field, not 'message'
        throw new Error(data.error || data.message || 'Registration failed');
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @returns {Promise} Logout response
   */
  async logout() {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(API_ENDPOINTS.LOGOUT, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      // Clear local storage regardless of response
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const data = await response.json();
      return data;
    } catch (error) {
      // Clear local storage even on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current logged in user
   * @returns {Promise} User data
   */
  async getCurrentUser() {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(API_ENDPOINTS.GET_ME, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      // Update user in localStorage
      localStorage.setItem('user', JSON.stringify(data.data));

      return data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Update user details
   * @param {Object} updates - User details to update
   * @returns {Promise} Updated user data
   */
  async updateDetails(updates) {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(API_ENDPOINTS.UPDATE_DETAILS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update details');
      }

      // Update user in localStorage
      localStorage.setItem('user', JSON.stringify(data.data));

      return data;
    } catch (error) {
      console.error('Update details error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update (firstName, lastName, phone, location)
   * @returns {Promise} Updated user data
   */
  async updateProfile(profileData) {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(API_ENDPOINTS.UPDATE_DETAILS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update user in localStorage
      if (data.data) {
        localStorage.setItem('user', JSON.stringify(data.data));
      }

      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Update user avatar
   * @param {File} file - Image file
   * @returns {Promise} Updated user data
   */
  async updateAvatar(file) {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(API_ENDPOINTS.UPDATE_AVATAR, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update avatar');
      }

      if (data.data) {
        localStorage.setItem('user', JSON.stringify(data.data));
      }

      return data;
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    }
  }

  /**
   * Update password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise} Response with new token
   */
  async updatePassword(currentPassword, newPassword) {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(API_ENDPOINTS.UPDATE_PASSWORD, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      // Update token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return data;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  /**
   * Forgot password
   * @param {string} email - User email
   * @returns {Promise} Response
   */
  async forgotPassword(email) {
    try {
      const response = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend returns error in 'error' field, not 'message'
        throw new Error(data.error || data.message || 'Failed to process forgot password');
      }

      return data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {Promise} Response
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(API_ENDPOINTS.RESET_PASSWORD.replace(':token', token), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to reset password');
      }

      // Store token in localStorage if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /**
   * Get stored token
   * @returns {string|null} Token
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Get stored user
   * @returns {Object|null} User object
   */
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
