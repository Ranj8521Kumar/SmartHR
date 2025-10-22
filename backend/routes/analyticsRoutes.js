const express = require('express');
const {
  getDashboardAnalytics,
  getApplicationAnalytics,
  getJobAnalytics,
  matchCandidates
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and specific roles
router.use(protect);
router.use(authorize('hr_recruiter', 'manager', 'admin'));

router.get('/dashboard', getDashboardAnalytics);
router.get('/applications', getApplicationAnalytics);
router.get('/jobs', getJobAnalytics);
router.post('/candidate-match', matchCandidates);

module.exports = router;
