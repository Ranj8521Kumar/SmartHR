const express = require('express');
const {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getJobs)
  .post(protect, authorize('hr_recruiter', 'manager', 'admin'), createJob);

router.route('/:id')
  .get(getJob)
  .put(protect, authorize('hr_recruiter', 'manager', 'admin'), updateJob)
  .delete(protect, authorize('hr_recruiter', 'manager', 'admin'), deleteJob);

module.exports = router;
