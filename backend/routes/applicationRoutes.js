const express = require('express');
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  scheduleInterview
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

module.exports = router;
