import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

/**
 * Upload interview recording to Cloudinary
 * @param {string} applicationId - Application ID
 * @param {string} interviewId - Interview ID
 * @param {Blob} recordingBlob - Recorded video/audio blob
 * @param {string} recordingType - 'video' or 'audio'
 * @returns {Promise<Object>} - Upload response
 */
export const uploadInterviewRecording = async (applicationId, interviewId, recordingBlob, recordingType = 'video') => {
  try {
    const formData = new FormData();

    // Create a filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `interview_${recordingType}_${timestamp}.webm`;

    // Append the recording blob
    formData.append('recording', recordingBlob, filename);

    // Append recording type
    formData.append('recordingType', recordingType);

    const response = await axios.post(
      `${API_BASE_URL}/applications/${applicationId}/ai-interview/${interviewId}/recording`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 300000, // 5 minutes timeout for large video uploads
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      }
    );

    if (response?.data?.success) {
      console.log('[Frontend] Recording uploaded (private):', response.data.data);
    } else {
      console.warn('[Frontend] Upload response (private) not successful:', response?.data);
    }
    return response.data;
  } catch (error) {
    console.error('Error uploading interview recording:', error);
    throw error.response?.data || error;
  }
};

/**
 * Public upload of interview recording via unique link (candidate-side)
 */
export const uploadInterviewRecordingByLink = async (link, recordingBlob, recordingType = 'video') => {
  try {
    const formData = new FormData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `interview_${recordingType}_${timestamp}.webm`;
    formData.append('recording', recordingBlob, filename);
    formData.append('recordingType', recordingType);

    const response = await axios.post(
      `${API_BASE_URL}/applications/public/ai-interview/${link}/recording`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      }
    );

    if (response?.data?.success) {
      console.log('[Frontend] Recording uploaded (public):', response.data.data);
    } else {
      console.warn('[Frontend] Upload response (public) not successful:', response?.data);
    }
    return response.data;
  } catch (error) {
    console.error('Error uploading interview recording by link:', error);
    throw error.response?.data || error;
  }
};

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
              // Get scheduled date - check both regular and AI interview scheduledDate
              const scheduledDate = interview.scheduledDate || interview.aiInterview?.scheduledDate;

              interviews.push({
                _id: interview._id || `${app._id}-${scheduledDate || Date.now()}`,
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
                scheduledDate: scheduledDate,
                type: interview.type,
                interviewer: interview.interviewer,
                feedback: interview.feedback,
                rating: interview.rating,
                status: interview.status || (app.status === 'interviewed' ? 'Completed' : 'Scheduled'),
                // Include AI interview data if present
                aiInterview: interview.aiInterview,
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
          scheduled: interviews.filter(i => i.status?.toLowerCase() === 'scheduled' || i.status?.toLowerCase() === 'pending').length,
          completed: interviews.filter(i => i.status?.toLowerCase() === 'completed').length,
          upcoming: interviews.filter(i => {
            if (!i.scheduledDate) return false;
            const interviewDate = new Date(i.scheduledDate);
            const status = i.status?.toLowerCase();
            return interviewDate > now && (status === 'scheduled' || status === 'pending');
          }).length,
          today: interviews.filter(i => {
            if (!i.scheduledDate) return false;
            const interviewDate = new Date(i.scheduledDate);
            const status = i.status?.toLowerCase();
            return (
              interviewDate.toDateString() === now.toDateString() &&
              (status === 'scheduled' || status === 'pending')
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
      // Support both JSON and multipart (FormData) payloads
      if (typeof FormData !== 'undefined' && data instanceof FormData) {
        const response = await axios.put(
          `${API_BASE_URL}/applications/${applicationId}/ai-interview/${interviewId}`,
          data,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            timeout: 300000
          }
        );
        return response.data;
      } else {
        const response = await apiClient.put(`/applications/${applicationId}/ai-interview/${interviewId}`, data);
        return response.data;
      }
    } catch (error) {
      console.error('Error updating AI interview status:', error);
      throw error.response?.data || { success: false, error: 'Failed to update AI interview status' };
    }
  },

  /**
   * Update AI interview status via public link (for candidates)
   * @param {String} link - Unique interview link
   * @param {Object} data - Interview status data
   * @returns {Promise} - Response with updated status
   */
  updateAIInterviewStatusByLink: async (link, data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/applications/public/ai-interview/${link}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          timeout: 300000
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating AI interview status by link:', error);
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

      // Get auth token from localStorage
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_BASE_URL}/applications/public/ai-interview/${link}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

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
      // Handle authentication errors
      if (axios.isAxiosError?.(error) && error.response) {
        const { status, data } = error.response;

        // Handle authentication required (401)
        if (status === 401) {
          return {
            success: false,
            requiresAuth: true,
            error: data?.error || 'You must be logged in to access this interview'
          };
        }

        // Handle wrong account (403)
        if (status === 403) {
          return {
            success: false,
            requiresCorrectAccount: true,
            expectedEmail: data?.expectedEmail,
            error: data?.error || 'This interview is assigned to a different account'
          };
        }

        // Handle expired/completed link (410)
        if (status === 410) {
          return {
            success: false,
            expired: true,
            error: data?.error || 'This interview link has expired'
          };
        }

        return {
          success: false,
          error: data?.error || `Request failed with status ${status}`
        };
      }
      return {
        success: false,
        error: error?.message || 'Failed to get AI interview'
      };
    }
  },

  // Vapi integration removed

  /**
   * Transcribe audio blob via backend Whisper route
   */
  transcribeAudio: async (blob) => {
    try {
      const formData = new FormData();
      const filename = `audio_${Date.now()}.webm`;
      formData.append('audio', blob, filename);
      const response = await axios.post(`${API_BASE_URL}/transcriptions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      return response.data;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error.response?.data || { success: false, error: 'Failed to transcribe audio' };
    }
  },
};

export default interviewService;
