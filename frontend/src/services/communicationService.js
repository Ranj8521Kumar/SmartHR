import { API_ENDPOINTS } from '../config/api';
import authService from './authService';

const communicationService = {
  /**
   * Get all communications/messages
   * @param {Object} params - Query parameters
   * @returns {Promise} - Response with communications data
   */
  getCommunications: async (params = {}) => {
    try {
      // For now, we'll fetch applications and extract communication history
      const queryString = new URLSearchParams({
        ...params,
        limit: 1000
      }).toString();
      const url = `${API_ENDPOINTS.APPLICATIONS}?${queryString}`;
      const token = authService.getToken();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch communications');
      }

      const data = await response.json();
      
      if (data.success) {
        const applications = data.data || [];
        const communications = [];
        
        // Extract communications from applications
        applications.forEach(app => {
          // Add initial application submission as a communication
          communications.push({
            id: `app-${app._id}`,
            type: 'application',
            subject: `Application for ${app.job?.title || 'Position'}`,
            message: `${app.applicant?.firstName || 'Candidate'} ${app.applicant?.lastName || ''} submitted an application`,
            candidateName: `${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}`,
            candidateEmail: app.applicant?.email || '',
            jobTitle: app.job?.title || 'Unknown Position',
            status: app.status,
            date: app.createdAt || new Date(),
            read: true,
            applicationId: app._id
          });

          // Add interview communications
          if (app.interviews && app.interviews.length > 0) {
            app.interviews.forEach((interview, idx) => {
              communications.push({
                id: `interview-${app._id}-${idx}`,
                type: 'interview',
                subject: `Interview Scheduled: ${app.job?.title || 'Position'}`,
                message: `Interview scheduled with ${app.applicant?.firstName || 'Candidate'} for ${interview.date}`,
                candidateName: `${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}`,
                candidateEmail: app.applicant?.email || '',
                jobTitle: app.job?.title || 'Unknown Position',
                status: interview.status || 'scheduled',
                date: interview.date || interview.scheduledDate || app.updatedAt,
                read: false,
                applicationId: app._id,
                interviewType: interview.type
              });
            });
          }

          // Add status change communications
          if (app.status === 'offer_extended') {
            communications.push({
              id: `offer-${app._id}`,
              type: 'offer',
              subject: `Job Offer Extended: ${app.job?.title || 'Position'}`,
              message: `Job offer has been extended to ${app.applicant?.firstName || 'Candidate'}`,
              candidateName: `${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}`,
              candidateEmail: app.applicant?.email || '',
              jobTitle: app.job?.title || 'Unknown Position',
              status: 'offer_extended',
              date: app.updatedAt || new Date(),
              read: false,
              applicationId: app._id
            });
          }

          if (app.status === 'accepted') {
            communications.push({
              id: `accepted-${app._id}`,
              type: 'acceptance',
              subject: `Offer Accepted: ${app.job?.title || 'Position'}`,
              message: `${app.applicant?.firstName || 'Candidate'} has accepted the job offer`,
              candidateName: `${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}`,
              candidateEmail: app.applicant?.email || '',
              jobTitle: app.job?.title || 'Unknown Position',
              status: 'accepted',
              date: app.updatedAt || new Date(),
              read: false,
              applicationId: app._id
            });
          }

          if (app.status === 'rejected') {
            communications.push({
              id: `rejected-${app._id}`,
              type: 'rejection',
              subject: `Application Update: ${app.job?.title || 'Position'}`,
              message: `Application for ${app.applicant?.firstName || 'Candidate'} has been rejected`,
              candidateName: `${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}`,
              candidateEmail: app.applicant?.email || '',
              jobTitle: app.job?.title || 'Unknown Position',
              status: 'rejected',
              date: app.updatedAt || new Date(),
              read: true,
              applicationId: app._id
            });
          }
        });

        // Sort by date (newest first)
        communications.sort((a, b) => new Date(b.date) - new Date(a.date));

        return {
          success: true,
          data: communications,
          total: communications.length
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching communications:', error);
      throw error;
    }
  },

  /**
   * Get communication statistics
   * @returns {Promise} - Response with stats
   */
  getCommunicationStats: async () => {
    try {
      const response = await communicationService.getCommunications();
      
      if (response.success && response.data) {
        const communications = response.data;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const stats = {
          total: communications.length,
          unread: communications.filter(c => !c.read).length,
          today: communications.filter(c => new Date(c.date) >= today).length,
          thisWeek: communications.filter(c => new Date(c.date) >= weekAgo).length,
          byType: {
            application: communications.filter(c => c.type === 'application').length,
            interview: communications.filter(c => c.type === 'interview').length,
            offer: communications.filter(c => c.type === 'offer').length,
            acceptance: communications.filter(c => c.type === 'acceptance').length,
            rejection: communications.filter(c => c.type === 'rejection').length
          }
        };

        return {
          success: true,
          data: stats
        };
      }

      return { success: false, data: null };
    } catch (error) {
      console.error('Error fetching communication stats:', error);
      throw error;
    }
  },

  /**
   * Mark communication as read
   * @param {String} communicationId - Communication ID
   * @returns {Promise} - Response
   */
  markAsRead: async (communicationId) => {
    // In a real implementation, this would update the database
    // For now, we'll just return success
    console.log('Marking communication as read:', communicationId);
    return {
      success: true,
      message: 'Communication marked as read'
    };
  },

  /**
   * Send a new message/email to a candidate
   * @param {Object} messageData - Message details
   * @returns {Promise} - Response
   */
  sendMessage: async (messageData) => {
    try {
      // In a real implementation, this would send an email via the backend
      // For now, we'll simulate success
      return {
        success: true,
        message: 'Message sent successfully',
        data: {
          id: `msg-${Date.now()}`,
          ...messageData,
          date: new Date(),
          read: true
        }
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
};

export default communicationService;
