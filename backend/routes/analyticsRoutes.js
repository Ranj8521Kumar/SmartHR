const express = require('express');
const {
  getDashboardAnalytics,
  getApplicationAnalytics,
  getJobAnalytics,
  matchCandidates,
  getSystemLogs,
  getManagerDashboardAnalytics
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and specific roles
router.use(protect);
router.use(authorize('hr_recruiter', 'manager', 'admin'));

router.get('/dashboard', getDashboardAnalytics);
router.get('/manager-dashboard', getManagerDashboardAnalytics);
router.get('/applications', getApplicationAnalytics);
router.get('/jobs', getJobAnalytics);
router.post('/candidate-match', matchCandidates);
router.get('/logs', authorize('admin'), getSystemLogs);

module.exports = router;
