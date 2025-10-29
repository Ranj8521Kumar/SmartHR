const express = require('express');
const {
  upload,
  uploadRecording,
  getRecordings,
  getRecording,
  getRecordingsByApplication,
  getRecordingsByApplicant,
  updateRecording,
  deleteRecording,
  getDownloadLink
} = require('../controllers/interviewRecordingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes (none for now)

// Protected routes
router.use(protect);

// Upload recording (HR/Manager/Admin)
router.post(
  '/upload',
  authorize('admin', 'manager', 'hr_recruiter'),
  upload.single('recording'),
  uploadRecording
);

// Get all recordings (HR/Manager/Admin)
router.get(
  '/',
  authorize('admin', 'manager', 'hr_recruiter'),
  getRecordings
);

// Get recordings by application
router.get(
  '/application/:applicationId',
  getRecordingsByApplication
);

// Get recordings by applicant
router.get(
  '/applicant/:applicantId',
  getRecordingsByApplicant
);

// Get single recording
router.get('/:id', getRecording);

// Get download link
router.get('/:id/download', getDownloadLink);

// Update recording (HR/Manager/Admin)
router.put(
  '/:id',
  authorize('admin', 'manager', 'hr_recruiter'),
  updateRecording
);

// Delete recording (Admin only)
router.delete(
  '/:id',
  authorize('admin'),
  deleteRecording
);

module.exports = router;
