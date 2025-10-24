import { API_ENDPOINTS } from '../config/api';
import authService from './authService';

const jobService = {
  // Get all jobs with filters
  async getJobs(params = {}) {
    const token = authService.getToken();
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_ENDPOINTS.JOBS}?${queryString}` : API_ENDPOINTS.JOBS;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch jobs');
    }

    return response.json();
  },

  // Get single job by ID
  async getJobById(id) {
    const response = await fetch(`${API_ENDPOINTS.JOBS}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch job');
    }

    return response.json();
  },

  // Create new job
  async createJob(jobData) {
    const token = authService.getToken();
    
    const response = await fetch(API_ENDPOINTS.JOBS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create job');
    }

    return response.json();
  },

  // Update job
  async updateJob(id, jobData) {
    const token = authService.getToken();
    
    const response = await fetch(`${API_ENDPOINTS.JOBS}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update job');
    }

    return response.json();
  },

  // Delete job
  async deleteJob(id) {
    const token = authService.getToken();
    
    const response = await fetch(`${API_ENDPOINTS.JOBS}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete job');
    }

    return response.json();
  },
};

export default jobService;
