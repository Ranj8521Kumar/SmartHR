// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  GET_ME: `${API_BASE_URL}/auth/me`,
  UPDATE_DETAILS: `${API_BASE_URL}/auth/updatedetails`,
  UPDATE_PASSWORD: `${API_BASE_URL}/auth/updatepassword`,
  UPDATE_AVATAR: `${API_BASE_URL}/auth/avatar`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgotpassword`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/resetpassword/:token`,
  
  // User endpoints
  USERS: `${API_BASE_URL}/users`,
  
  // Job endpoints
  JOBS: `${API_BASE_URL}/jobs`,
  
  // Application endpoints
  APPLICATIONS: `${API_BASE_URL}/applications`,
  
  // Resume endpoints
  RESUMES: `${API_BASE_URL}/resumes`,
  
  // Analytics endpoints
  ANALYTICS: `${API_BASE_URL}/analytics`,
};

export default API_BASE_URL;
