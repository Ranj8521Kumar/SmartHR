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
};

export default interviewService;
