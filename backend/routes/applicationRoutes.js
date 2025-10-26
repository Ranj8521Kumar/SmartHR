const express = require('express');
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  scheduleInterview,
  scheduleAIInterview,
  getAIInterviewLink,
  updateAIInterviewStatus,
  getAIInterviewByLink,
  getVapiConfig,
  updateAIInterviewWithVapi
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, getApplications)
  .post(protect, createApplication);

router.route('/:id')
  .get(protect, getApplication)
  .put(protect, authorize('hr_recruiter', 'manager', 'admin'), updateApplication)
  .delete(protect, deleteApplication);

router.post('/:id/interview', protect, authorize('hr_recruiter', 'manager', 'admin'), scheduleInterview);

// AI Interview routes
router.post('/:id/ai-interview', protect, authorize('hr_recruiter', 'manager', 'admin'), scheduleAIInterview);
router.get('/:id/ai-interview-link', protect, authorize('hr_recruiter', 'manager', 'admin'), getAIInterviewLink);
router.put('/:id/ai-interview/:interviewId', protect, authorize('hr_recruiter', 'manager', 'admin'), updateAIInterviewStatus);

// Vapi-related routes
router.get('/:id/vapi-config', protect, authorize('hr_recruiter', 'manager', 'admin'), getVapiConfig);
router.put('/:id/ai-interview/:interviewId/vapi', protect, authorize('hr_recruiter', 'manager', 'admin'), updateAIInterviewWithVapi);

// Public route for candidates to access AI interview
router.get('/public/ai-interview/:link', getAIInterviewByLink);

module.exports = router;
