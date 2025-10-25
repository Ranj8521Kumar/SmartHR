import { API_ENDPOINTS } from '../config/api';
import authService from './authService';

const applicationService = {
  // Get all applications with filters
  async getApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_ENDPOINTS.APPLICATIONS}?${queryString}` : API_ENDPOINTS.APPLICATIONS;
    const token = authService.getToken();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch applications');
    }

    return response.json();
  },

  // Get single application by ID
  async getApplicationById(id) {
    const token = authService.getToken();
    
    const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch application');
    }

    return response.json();
  },

  // Update application status
  async updateApplicationStatus(id, status, notes = '') {
    const token = authService.getToken();
    
    console.log('Updating application:', id, 'with data:', { status, notes });
    
    const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ status, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Backend error response:', error);
      throw new Error(error.message || 'Failed to update application status');
    }

    return response.json();
  },

  // Delete application
  async deleteApplication(id) {
    const token = authService.getToken();
    
    const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete application');
    }

    return response.json();
  },

  // Bulk update applications
  async bulkUpdateStatus(applicationIds, status) {
    const token = authService.getToken();
    
    const response = await fetch(`${API_ENDPOINTS.APPLICATIONS}/bulk-update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ applicationIds, status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to bulk update applications');
    }

    return response.json();
  },

  // Create new application
  async createApplication(applicationData) {
    const token = authService.getToken();
    
    const response = await fetch(API_ENDPOINTS.APPLICATIONS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create application');
    }

    return response.json();
  },
};

export default applicationService;
