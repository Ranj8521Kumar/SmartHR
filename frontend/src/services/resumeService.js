import { API_ENDPOINTS } from '../config/api';
import authService from './authService';

const resumeService = {
  // Upload resume
  async uploadResume(file) {
    const token = authService.getToken();
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await fetch(`${API_ENDPOINTS.RESUMES}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload resume');
    }

    return response.json();
  },

  // Get user's resumes
  async getMyResumes() {
    const token = authService.getToken();
    
    const response = await fetch(API_ENDPOINTS.RESUMES, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch resumes');
    }

    return response.json();
  },

  // Get single resume
  async getResume(id) {
    const token = authService.getToken();
    
    const response = await fetch(`${API_ENDPOINTS.RESUMES}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch resume');
    }

    return response.json();
  },

  // Delete resume
  async deleteResume(id) {
    const token = authService.getToken();
    
    const response = await fetch(`${API_ENDPOINTS.RESUMES}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete resume');
    }

    return response.json();
  },

  // Parse resume
  async parseResume(id) {
    const token = authService.getToken();
    
    const response = await fetch(`${API_ENDPOINTS.RESUMES}/parse/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to parse resume');
    }

    return response.json();
  },
};

export default resumeService;
