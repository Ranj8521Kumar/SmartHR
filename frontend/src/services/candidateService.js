import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import authService from './authService';

// Create an axios client without hardcoding a different base URL.
// We'll pass full endpoint URLs from API_ENDPOINTS to avoid env var mismatches.
const apiClient = axios.create();

// Attach auth token on each request
apiClient.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const candidateService = {
  /**
   * Get all candidates (unique applicants from applications)
   * @param {Object} params - Query parameters (status, search, etc.)
   * @returns {Promise} - Response with candidates data
   */
  getCandidates: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.APPLICATIONS, { params });
      
      if (response.data.success) {
        // Extract unique candidates from applications
        const applicationsData = response.data.data || [];
        const candidatesMap = new Map();
        
        applicationsData.forEach(app => {
          if (app.applicant && app.applicant._id) {
            const candidateId = app.applicant._id;
            
            if (!candidatesMap.has(candidateId)) {
              // First time seeing this candidate
              candidatesMap.set(candidateId, {
                _id: candidateId,
                firstName: app.applicant.firstName,
                lastName: app.applicant.lastName,
                email: app.applicant.email,
                phone: app.applicant.phone,
                applications: [],
                totalApplications: 0,
                latestStatus: app.status,
                latestApplication: app.createdAt,
                averageScore: 0,
                skills: [],
              });
            }
            
            // Add this application to the candidate
            const candidate = candidatesMap.get(candidateId);
            candidate.applications.push({
              _id: app._id,
              job: app.job,
              status: app.status,
              aiScore: app.aiScore,
              createdAt: app.createdAt,
              resume: app.resume,
            });
            
            // Update latest application date
            if (new Date(app.createdAt) > new Date(candidate.latestApplication)) {
              candidate.latestApplication = app.createdAt;
              candidate.latestStatus = app.status;
            }
            
            // Add skills from resume if available
            if (app.resume && app.resume.skills) {
              candidate.skills = [...new Set([...candidate.skills, ...app.resume.skills])];
            }
          }
        });
        
        // Calculate statistics for each candidate
        const candidates = Array.from(candidatesMap.values()).map(candidate => {
          candidate.totalApplications = candidate.applications.length;
          
          // Calculate average AI score
          const scoresWithValues = candidate.applications
            .filter(app => app.aiScore && app.aiScore.overallScore)
            .map(app => app.aiScore.overallScore);
          
          if (scoresWithValues.length > 0) {
            candidate.averageScore = Math.round(
              scoresWithValues.reduce((sum, score) => sum + score, 0) / scoresWithValues.length
            );
          }
          
          // Get highest score
          candidate.highestScore = scoresWithValues.length > 0 
            ? Math.max(...scoresWithValues) 
            : 0;
          
          // Count status distribution
          candidate.statusCounts = {
            submitted: 0,
            under_review: 0,
            shortlisted: 0,
            interview_scheduled: 0,
            interviewed: 0,
            offer_extended: 0,
            accepted: 0,
            rejected: 0,
            withdrawn: 0,
          };
          
          candidate.applications.forEach(app => {
            if (Object.prototype.hasOwnProperty.call(candidate.statusCounts, app.status)) {
              candidate.statusCounts[app.status]++;
            }
          });
          
          return candidate;
        });
        
        // Sort by latest application date (most recent first)
        candidates.sort((a, b) => 
          new Date(b.latestApplication) - new Date(a.latestApplication)
        );
        
        return {
          success: true,
          data: candidates,
          count: candidates.length,
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      throw error.response?.data || { success: false, error: 'Failed to fetch candidates' };
    }
  },

  /**
   * Get candidate by ID (with all their applications)
   * @param {String} candidateId - User ID of the candidate
   * @returns {Promise} - Response with candidate details
   */
  getCandidateById: async (candidateId) => {
    try {
      // Get all applications for this candidate
      const response = await apiClient.get(API_ENDPOINTS.APPLICATIONS, {
        params: { applicant: candidateId }
      });
      
      if (response.data.success && response.data.data.length > 0) {
        const applications = response.data.data;
        const firstApp = applications[0];
        
        // Build candidate profile from applications
        const candidate = {
          _id: candidateId,
          firstName: firstApp.applicant.firstName,
          lastName: firstApp.applicant.lastName,
          email: firstApp.applicant.email,
          phone: firstApp.applicant.phone,
          applications: applications,
          totalApplications: applications.length,
        };
        
        // Calculate statistics
        const scoresWithValues = applications
          .filter(app => app.aiScore && app.aiScore.overallScore)
          .map(app => app.aiScore.overallScore);
        
        if (scoresWithValues.length > 0) {
          candidate.averageScore = Math.round(
            scoresWithValues.reduce((sum, score) => sum + score, 0) / scoresWithValues.length
          );
          candidate.highestScore = Math.max(...scoresWithValues);
        }
        
        // Get all unique skills
        const allSkills = new Set();
        applications.forEach(app => {
          if (app.resume && app.resume.skills) {
            app.resume.skills.forEach(skill => allSkills.add(skill));
          }
        });
        candidate.skills = Array.from(allSkills);
        
        return {
          success: true,
          data: candidate,
        };
      }
      
      return { success: false, error: 'Candidate not found' };
    } catch (error) {
      console.error('Error fetching candidate:', error);
      throw error.response?.data || { success: false, error: 'Failed to fetch candidate' };
    }
  },

  /**
   * Get candidate statistics
   * @returns {Promise} - Response with candidate statistics
   */
  getCandidateStats: async () => {
    try {
      const candidatesResponse = await candidateService.getCandidates();
      
      if (candidatesResponse.success) {
        const candidates = candidatesResponse.data;
        
        const stats = {
          totalCandidates: candidates.length,
          activeCandidates: candidates.filter(c => 
            ['submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_extended']
            .includes(c.latestStatus)
          ).length,
          hiredCandidates: candidates.filter(c => c.latestStatus === 'accepted').length,
          rejectedCandidates: candidates.filter(c => c.latestStatus === 'rejected').length,
          averageApplicationsPerCandidate: candidates.length > 0
            ? Math.round(candidates.reduce((sum, c) => sum + c.totalApplications, 0) / candidates.length * 10) / 10
            : 0,
        };
        
        return {
          success: true,
          data: stats,
        };
      }
      
      return candidatesResponse;
    } catch (error) {
      console.error('Error fetching candidate stats:', error);
      throw error;
    }
  },
};

export default candidateService;
