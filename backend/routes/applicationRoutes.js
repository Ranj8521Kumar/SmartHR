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
  updateAIInterviewStatusPublic,
  getAIInterviewByLink,
  uploadInterviewRecording,
  uploadInterviewRecordingPublic,
  uploadInterviewRecordingRaw,
  uploadInterviewRecordingRawPublic,
  startInterviewRecording,
  heartbeatInterviewRecording,
  getInterviewRecordingStatus,
  startInterviewRecordingPublic,
  heartbeatInterviewRecordingPublic,
  getInterviewRecordingStatusPublic,
  verifyRecordingInDatabase,
  verifyRecordingInDatabasePublic
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

// Public AI Interview routes (placed before dynamic :id routes to avoid collisions)
// Now requires authentication - candidate must be logged in
router.get('/public/ai-interview/:link', protect, getAIInterviewByLink);
// Public interview status update (candidate completing interview)
router.put('/public/ai-interview/:link', protect, updateAIInterviewStatusPublic);
// Public recording upload by link (candidate)
router.post('/public/ai-interview/:link/recording', uploadInterviewRecordingPublic);
router.post('/public/ai-interview/:link/recording/raw', express.raw({ type: 'application/octet-stream', limit: '200mb' }), uploadInterviewRecordingRawPublic);
// Public recording status routes (candidate)
router.post('/public/ai-interview/:link/recording/start', startInterviewRecordingPublic);
router.post('/public/ai-interview/:link/recording/heartbeat', heartbeatInterviewRecordingPublic);
router.get('/public/ai-interview/:link/recording/status', getInterviewRecordingStatusPublic);
// ✅ Public recording verification route (candidate)
router.get('/public/ai-interview/:link/recording/verify', verifyRecordingInDatabasePublic);

// AI Interview routes (authenticated)
router.post('/:id/ai-interview', protect, authorize('hr_recruiter', 'manager', 'admin'), scheduleAIInterview);
router.get('/:id/ai-interview-link', protect, authorize('hr_recruiter', 'manager', 'admin'), getAIInterviewLink);
router.put('/:id/ai-interview/:interviewId', protect, authorize('hr_recruiter', 'manager', 'admin'), updateAIInterviewStatus);

// Vapi-related routes removed

// Recording upload route (authenticated)
router.post('/:id/ai-interview/:interviewId/recording', protect, authorize('hr_recruiter', 'manager', 'admin'), uploadInterviewRecording);
router.post('/:id/ai-interview/:interviewId/recording/raw', protect, authorize('hr_recruiter', 'manager', 'admin'), express.raw({ type: 'application/octet-stream', limit: '200mb' }), uploadInterviewRecordingRaw);
// Recording status routes (authenticated)
router.post('/:id/ai-interview/:interviewId/recording/start', protect, authorize('hr_recruiter', 'manager', 'admin'), startInterviewRecording);
router.post('/:id/ai-interview/:interviewId/recording/heartbeat', protect, authorize('hr_recruiter', 'manager', 'admin'), heartbeatInterviewRecording);
router.get('/:id/ai-interview/:interviewId/recording/status', protect, authorize('hr_recruiter', 'manager', 'admin'), getInterviewRecordingStatus);
// ✅ Recording verification route (authenticated)
router.get('/:id/ai-interview/:interviewId/recording/verify', protect, authorize('hr_recruiter', 'manager', 'admin'), verifyRecordingInDatabase);

module.exports = router;
