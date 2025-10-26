import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Get auth token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

// Axios instance with auth header
const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const interviewService = {
  /**
   * Get all interviews from applications with interview_scheduled or interviewed status
   * @param {Object} params - Query parameters
   * @returns {Promise} - Response with interviews data
   */
  getInterviews: async (params = {}) => {
    try {
      // Fetch all applications (we'll filter by status client-side)
      const response = await apiClient.get('/applications', { 
        params: {
          ...params,
          limit: 1000 // Get a large number to ensure we get all interviews
        }
      });
      
      if (response.data.success) {
        const applications = response.data.data || [];
        const interviews = [];
        
        // Filter applications with interview-related statuses
        const interviewApplications = applications.filter(app => 
          app.status === 'interview_scheduled' || app.status === 'interviewed'
        );
        
        // Extract interview data from applications
        interviewApplications.forEach(app => {
          if (app.interviews && app.interviews.length > 0) {
            // Process each interview in the application
            app.interviews.forEach(interview => {
              interviews.push({
                _id: interview._id || `${app._id}-${interview.scheduledDate}`,
                application: {
                  _id: app._id,
                  status: app.status,
                  aiScore: app.aiScore,
                },
                candidate: {
                  _id: app.applicant?._id,
                  firstName: app.applicant?.firstName,
                  lastName: app.applicant?.lastName,
                  email: app.applicant?.email,
                  phone: app.applicant?.phone,
                },
                job: app.job,
                scheduledDate: interview.scheduledDate,
                type: interview.type,
                interviewer: interview.interviewer,
                feedback: interview.feedback,
                rating: interview.rating,
                status: interview.status || (app.status === 'interviewed' ? 'completed' : 'scheduled'),
              });
            });
          } else if (app.status === 'interview_scheduled') {
            // If no specific interviews array but status is interview_scheduled
            interviews.push({
              _id: app._id,
              application: {
                _id: app._id,
                status: app.status,
                aiScore: app.aiScore,
              },
              candidate: {
                _id: app.applicant?._id,
                firstName: app.applicant?.firstName,
                lastName: app.applicant?.lastName,
                email: app.applicant?.email,
                phone: app.applicant?.phone,
              },
              job: app.job,
              scheduledDate: null,
              type: null,
              interviewer: null,
              feedback: null,
              rating: null,
              status: 'pending',
            });
          }
        });
        
        // Sort by scheduled date (upcoming first, then nulls)
        interviews.sort((a, b) => {
          if (!a.scheduledDate && !b.scheduledDate) return 0;
          if (!a.scheduledDate) return 1;
          if (!b.scheduledDate) return -1;
          return new Date(a.scheduledDate) - new Date(b.scheduledDate);
        });
        
        return {
          success: true,
          data: interviews,
          count: interviews.length,
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching interviews:', error);
      throw error.response?.data || { success: false, error: 'Failed to fetch interviews' };
    }
  },

  /**
   * Get interview statistics
   * @returns {Promise} - Response with interview statistics
   */
  getInterviewStats: async () => {
    try {
      const response = await interviewService.getInterviews();
      
      if (response.success) {
        const interviews = response.data;
        const now = new Date();
        
        const stats = {
          totalInterviews: interviews.length,
          scheduled: interviews.filter(i => i.status === 'scheduled' || i.status === 'pending').length,
          completed: interviews.filter(i => i.status === 'completed').length,
          upcoming: interviews.filter(i => {
            if (!i.scheduledDate) return false;
            const interviewDate = new Date(i.scheduledDate);
            return interviewDate > now && (i.status === 'scheduled' || i.status === 'pending');
          }).length,
          today: interviews.filter(i => {
            if (!i.scheduledDate) return false;
            const interviewDate = new Date(i.scheduledDate);
            return (
              interviewDate.toDateString() === now.toDateString() &&
              (i.status === 'scheduled' || i.status === 'pending')
            );
          }).length,
          byType: {
            phone: interviews.filter(i => i.type === 'phone').length,
            video: interviews.filter(i => i.type === 'video').length,
            'in-person': interviews.filter(i => i.type === 'in-person').length,
            technical: interviews.filter(i => i.type === 'technical').length,
            hr: interviews.filter(i => i.type === 'hr').length,
          },
        };
        
        return {
          success: true,
          data: stats,
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching interview stats:', error);
      throw error;
    }
  },

  /**
   * Update interview feedback
   * @param {String} applicationId - Application ID
   * @param {String} interviewId - Interview ID
   * @param {Object} data - Interview data (feedback, rating, status)
   * @returns {Promise} - Response with updated interview
   */
  updateInterviewFeedback: async (applicationId, interviewId, data) => {
    try {
      // This would require a backend endpoint to update interview feedback
      // For now, we'll use the application status update
      const response = await apiClient.put(`/applications/${applicationId}/status`, {
        status: data.status || 'interviewed',
        notes: data.feedback,
      });

      return response.data;
    } catch (error) {
      console.error('Error updating interview feedback:', error);
      throw error.response?.data || { success: false, error: 'Failed to update interview' };
    }
  },

  /**
   * Schedule AI video interview
   * @param {String} applicationId - Application ID
   * @param {Object} data - Interview data (duration, notes)
   * @returns {Promise} - Response with AI interview details
   */
  scheduleAIInterview: async (applicationId, data) => {
    try {
      const response = await apiClient.post(`/applications/${applicationId}/ai-interview`, data);
      return response.data;
    } catch (error) {
      console.error('Error scheduling AI interview:', error);
      throw error.response?.data || { success: false, error: 'Failed to schedule AI interview' };
    }
  },

  /**
   * Get AI interview link
   * @param {String} applicationId - Application ID
   * @returns {Promise} - Response with AI interview link
   */
  getAIInterviewLink: async (applicationId) => {
    try {
      const response = await apiClient.get(`/applications/${applicationId}/ai-interview-link`);
      return response.data;
    } catch (error) {
      console.error('Error getting AI interview link:', error);
      throw error.response?.data || { success: false, error: 'Failed to get AI interview link' };
    }
  },

  /**
   * Update AI interview status and feedback
   * @param {String} applicationId - Application ID
   * @param {String} interviewId - Interview ID
   * @param {Object} data - Update data (status, transcript, vapiCallId, notes)
   * @returns {Promise} - Response with updated AI interview
   */
  updateAIInterviewStatus: async (applicationId, interviewId, data) => {
    try {
      const response = await apiClient.put(`/applications/${applicationId}/ai-interview/${interviewId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating AI interview status:', error);
      throw error.response?.data || { success: false, error: 'Failed to update AI interview status' };
    }
  },

  /**
   * Get AI interview by unique link (public route for candidates)
   * @param {String} link - Unique interview link
   * @returns {Promise} - Response with AI interview details
   */
  getAIInterviewByLink: async (link) => {
    try {
      console.log('Fetching AI interview for link:', link);
      const response = await axios.get(`${API_BASE_URL}/applications/public/ai-interview/${link}`);
      
      // Log the raw response for debugging
      console.log('Raw API response:', response.data);
      
      // Validate the response data structure
      const data = response.data;
      if (!data) {
        console.error('Empty response from API');
        throw new Error('Empty response from server');
      }

      if (!data.success) {
        console.error('API request failed:', data.error);
        throw new Error(data.error || 'Server returned an error');
      }

      // Extract interview data
      const interviewData = data.data;
      
      // Validate required fields
      if (!interviewData) {
        console.error('No interview data in response:', data);
        throw new Error('No interview data found');
      }

      if (!interviewData.application || !interviewData.application._id) {
        console.error('Invalid interview data structure:', interviewData);
        throw new Error('Invalid interview data structure');
      }

      // Log the validated data
      console.log('Successfully fetched interview data:', {
        applicationId: interviewData.application._id,
        hasAIInterview: !!interviewData.aiInterview,
        status: interviewData.status,
        duration: interviewData.aiInterview?.duration,
        expiresAt: interviewData.aiInterview?.expiresAt
      });

      return {
        success: true,
        data: interviewData
      };
    } catch (error) {
      console.error('Error getting AI interview by link:', error);
      throw error.response?.data || { 
        success: false, 
        error: error.message || 'Failed to get AI interview'
      };
    }
  },

  /**
   * Update AI interview with Vapi call details
   * @param {String} applicationId - Application ID
   * @param {String} interviewId - Interview ID
   * @param {Object} vapiData - Vapi call data (callId, transcript, recordingUrl, etc.)
   * @returns {Promise} - Response with updated interview
   */
  updateAIInterviewWithVapi: async (applicationId, interviewId, vapiData) => {
    try {
      const response = await apiClient.put(`/applications/${applicationId}/ai-interview/${interviewId}/vapi`, vapiData);
      return response.data;
    } catch (error) {
      console.error('Error updating AI interview with Vapi data:', error);
      throw error.response?.data || { success: false, error: 'Failed to update AI interview' };
    }
  },

  /**
   * Get Vapi configuration for interview
   * @param {String} applicationId - Application ID
   * @returns {Promise} - Response with Vapi config
   */
  getVapiConfig: async (applicationId) => {
    try {
      const response = await apiClient.get(`/applications/${applicationId}/vapi-config`);
      return response.data;
    } catch (error) {
      console.error('Error getting Vapi config:', error);
      throw error.response?.data || { success: false, error: 'Failed to get Vapi config' };
    }
  },
};

export default interviewService;
